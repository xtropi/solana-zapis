"use client";
import { useEffect, useState } from "react";
import {
  AccountInfo,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { floor } from "./utils";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Grid,
  Container,
} from "@mui/material";
import {
  TransactionsTable,
  TransactionsTableItem,
} from "./components/TransactionsTable";
import { StakesTable, StakesTableItem } from "./components/StakesTable";
import { StakesChart, StakesChartData } from "./components/StakesChart";

type StakeAccount = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
  initStake?: number;
};

export const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [stakes, setStakes] = useState<StakeAccount[]>([]);
  const [stakesTable, setStakesTable] = useState<StakesTableItem[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<
    (ParsedTransactionWithMeta | null)[] | undefined
  >();
  const [transactionTableData, setTransactionTableData] = useState<
    TransactionsTableItem[]
  >([]);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey && transactionHistory && stakes.length > 0) {
      buildInitStakeInstructionsList();
    }
  }, [stakes]);

  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );

    connection.getAccountInfo(publicKey).then((info) => {
      info?.lamports && setBalance(info.lamports);
    });

    fetchStakes(publicKey.toString());
    fetchTransactions(publicKey.toString(), 100);
  }, [connection, publicKey]);

  async function fetchTransactions(address, numTx) {
    const pubKey = new PublicKey(address);
    //Find recent transactions
    let transactionList = await connection.getSignaturesForAddress(pubKey, {
      limit: numTx,
    });
    //Parse transactions to get signature for recent transactions
    let signatureList = transactionList.map(
      (transaction) => transaction.signature
    );
    //Get parsed details of each transaction
    let transactionDetails = await connection.getParsedTransactions(
      signatureList,
      { maxSupportedTransactionVersion: 0 }
    );
    //Update State
    setTransactionHistory(transactionDetails);
    const preparedTransactions = prepareTransactionsTableData(
      transactionDetails.sort((a, b) => a?.slot || 0 - (b?.slot || 0))
    );
    setTransactionTableData(preparedTransactions);
    console.table(preparedTransactions);
  }

  async function fetchStakes(address) {
    let programAccounts = await connection.getParsedProgramAccounts(
      new PublicKey("Stake11111111111111111111111111111111111111"),
      {
        // commitment: 'confirmed',
        filters: [
          {
            memcmp: {
              offset: 44,
              bytes: address, // your pubkey, encoded as a base-58 string
            },
          },
        ],
      }
    );
    setStakes(programAccounts);
  }

  function prepareTransactionsTableData(
    transactions: (ParsedTransactionWithMeta | null)[]
  ): TransactionsTableItem[] {
    if (!transactions || transactions.length === 0) return [];
    const f: ParsedTransactionWithMeta[] = transactions
      .map((item) => {
        let info = item.transaction.message.instructions.filter(
          (instr) => instr.parsed?.type && instr.parsed?.type === "transfer"
        )[0]?.parsed?.info;
        if (!info) return null;
        return item;
      })
      .filter((element) => {
        return (element !== null &&
          element !== undefined) as unknown as ParsedTransactionWithMeta;
      });
    return f.map((item) => {
      let info = item.transaction.message.instructions.filter(
        (instr) => instr.parsed?.type && instr.parsed?.type === "transfer"
      )[0]?.parsed?.info;
      let volume = info?.lamports || Number(info?.amount) || undefined;
      if (info.destination !== publicKey?.toString()) volume = volume * -1;
      return {
        volume: volume,
        slot: item.slot,
        blockTime: item.blockTime || undefined,
        status: item.meta!.err ? "Failed" : "Success",
      };
    });
  }

  function prepareStakesTableData(stakes: any[]): StakesTableItem[] {
    if (!stakes || stakes.length === 0) return [];
    return stakes.map((item) => {
      const activationEpoch = Number(
        item.account.data.parsed?.info.stake.delegation.activationEpoch
      );
      const rentEpoch = Number(item.account.rentEpoch);
      return {
        pubkey: item.pubkey.toString(),
        initStake: item.initStake,
        stake: item.account.lamports,
        reward: item.account.lamports - item.initStake!,
        activationEpoch: activationEpoch,
        rentEpoch: rentEpoch,
        blockTime: item.blockTime,
      };
    });
  }

  function prepareStakesChartData(value: any): StakesChartData[] {
    return [
        { epoch: 0, value: 10 },
        { epoch: 1, value: 20 },
        { epoch: 100, value: 50 },
        { epoch: 200, value: 80 },
        { epoch: 300, value: 316 },
        { epoch: 400, value: 380 },
        { epoch: 500, value: 452 },
        { epoch: 600, value: 526 },
      ]
  }

  function buildInitStakeInstructionsList() {
    if (!transactionHistory) return;
    let instruсtions: any = [];
    transactionHistory?.map((item) => {
      if (item === null) return;
      instruсtions.push(
        ...item.transaction.message.instructions.map((instruction) => ({
          ...instruction,
          blockTime: item.blockTime,
        }))
      );
    });
    instruсtions = instruсtions.filter((instr) =>
      instr.parsed?.type?.includes("createAccount")
    );
    console.table(
      instruсtions.map((item) => ({
        ...item.parsed!.info,
        type: item.parsed!.type,
      }))
    );

    setStakesTable(
      prepareStakesTableData(
        stakes.map((stake) => {
          const selected = instruсtions.find(
            (instr) => stake.pubkey.toString() === instr.parsed?.info.newAccount
          );
          const initStake = selected?.parsed?.info.lamports;
          const blockTime = selected?.blockTime!;
          return {
            ...stake,
            initStake,
            blockTime,
          };
        })
      )
    );
  }

  function countSum() {
    if (!transactionHistory) return;
    return (
      transactionHistory.reduce((acc, item) => {
        let info = item!.transaction.message.instructions.filter((instr) => {
          instr.parsed?.type && instr.parsed?.type === "transfer";
        })[0]?.parsed?.info;
        if (!info) return acc;
        let volume = info?.lamports;
        if (!volume) return acc;
        if (info.destination !== publicKey?.toString()) volume = volume * -1;
        return acc + volume;
      }, 0) / LAMPORTS_PER_SOL
    );
  }

  const total_stake =
    stakesTable.reduce((acc, item, i) => {
      return (acc = acc + item.stake);
    }, 0) / LAMPORTS_PER_SOL;
  const total_init_stake =
    stakesTable.reduce((acc, item, i) => {
      return (acc = acc + (item.initStake || item.stake));
    }, 0) / LAMPORTS_PER_SOL;
  const total_reward =
    stakesTable.reduce((acc, item, i) => {
      return (acc = acc + (item.stake - (item.initStake || item.stake)));
    }, 0) / LAMPORTS_PER_SOL;
  const total_return = (total_reward / total_init_stake) * 100;

  return (
    <div>
      <AppBar component="nav" position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            // onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            {/* <MenuIcon /> */}
          </IconButton>
          {/* <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            MUI
          </Typography> */}
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <WalletMultiButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                component="h2"
                variant="h5"
                color="primary"
                gutterBottom
              >
                Stakes:
              </Typography>
              <StakesTable data={stakesTable} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
              >
                Balance:{" "}
                {publicKey && balance
                  ? ` ${floor(balance / LAMPORTS_PER_SOL, 2)} SOL`
                  : ""}
              </Typography>

              {stakesTable && (
                <Typography
                  component="h2"
                  variant="h6"
                  color="primary"
                  gutterBottom
                >
                  Stake: {floor(total_stake, 2)} SOL
                </Typography>
              )}
              {stakesTable && (
                <Typography>
                  Initial Stake: {floor(total_init_stake, 2)} SOL
                </Typography>
              )}
              {stakesTable && (
                <Typography>Reward: {floor(total_reward, 2)} SOL</Typography>
              )}
              {stakesTable && (
                <Typography>TOTAL RETURN: {floor(total_return, 2)}%</Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
              <Typography
                component="h2"
                variant="h5"
                color="primary"
                gutterBottom
              >
                Transactions:
              </Typography>
              <TransactionsTable data={transactionTableData} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
              <Typography
                component="h2"
                variant="h5"
                color="primary"
                gutterBottom
              >
                Transactions:
              </Typography>
              <StakesChart chartData={[prepareStakesChartData(123)]} />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <br />
    </div>
  );
};
