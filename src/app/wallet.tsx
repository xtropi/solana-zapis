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

type StakeAccount = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
  initStake?: number;
};

export const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [stakes, setStakes] = useState<Array<StakeAccount>>([]);
  const [stakesTable, setStakesTable] = useState<Array<StakeAccount>>([]);
  const [transactionHistory, setTransactionHistory] = useState<
    (ParsedTransactionWithMeta | null)[] | undefined
  >();
  const [transactionTable, setTransactionTable] = useState<JSX.Element>();
  const [initStakeInstructionsList, setInitStakeInstructionsList] =
    useState<JSX.Element>();

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey && transactionHistory && stakes.length > 0) {
      buildInitStakeInstructionsList();
    }
  }, [stakes]);

  useEffect(() => {
    if (publicKey && transactionHistory) {
      buildTransactionTable();
    }
  }, [publicKey, connection, transactionHistory]);

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
    setTransactionHistory(
      transactionDetails.sort((a, b) => a?.slot || 0 - (b?.slot || 0))
    );
    console.table(transactionDetails);
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

  function buildTransactionTable() {
    if (transactionHistory && transactionHistory.length !== 0) {
      let header = (
        <TableHead>
          <TableRow>
            <TableCell>Volume</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Result</TableCell>
          </TableRow>
        </TableHead>
      );
      let rows = transactionHistory.map((item, i) => {
        if (item === null) return;
        let date = new Date(item.blockTime! * 1000).toLocaleDateString("ru-RU");
        let info = item.transaction.message.instructions.filter(
          (instr) => instr.parsed?.type && instr.parsed?.type === "transfer"
        )[0]?.parsed?.info;
        if (!info) return;
        let volume = info?.lamports;
        if (info.destination !== publicKey?.toString()) volume = volume * -1;
        return (
          <TableRow key={i + 1}>
            <TableCell>{(volume / LAMPORTS_PER_SOL).toString()}</TableCell>
            <TableCell>{item.slot.toLocaleString("en-US")}</TableCell>
            <TableCell>{date}</TableCell>
            <TableCell>{item.meta!.err ? "Failed" : "Success"}</TableCell>
          </TableRow>
        );
      });

      setTransactionTable(
        <TableContainer component={Paper}>
          <Table>
            {header}
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      setTransactionTable(undefined);
    }
  }

  function buildInitStakeInstructionsList() {
    if (!transactionHistory) return <></>;
    let instruсtions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];
    transactionHistory?.map((item, i) => {
      if (item === null) return;
      instruсtions.push(...item.transaction.message.instructions);
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
    setInitStakeInstructionsList(
      <>
        {instruсtions.map((item) => (
          <div key={item.parsed?.info.newAccount}>
            <div>
              {item.parsed?.info.newAccount},{" "}
              {item.parsed.info.lamports / LAMPORTS_PER_SOL}
            </div>
            <br />
          </div>
        ))}
      </>
    );
    setStakesTable((prevState) => {
      return stakes.map((stake) => {
        let initStake = instruсtions.find(
          (instr) => stake.pubkey.toString() === instr.parsed?.info.newAccount
        )?.parsed?.info.lamports;
        return {
          ...stake,
          initStake,
        };
      });
    });
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
      return (acc = acc + item.account.lamports);
    }, 0) / LAMPORTS_PER_SOL;
  const total_init_stake =
    stakesTable.reduce((acc, item, i) => {
      return (acc = acc + (item.initStake || item.account.lamports));
    }, 0) / LAMPORTS_PER_SOL;
  const total_reward =
    stakesTable.reduce((acc, item, i) => {
      return (acc =
        acc +
        (item.account.lamports - (item.initStake || item.account.lamports)));
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
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            MUI
          </Typography>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <WalletMultiButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Chart */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {stakesTable &&
                stakesTable.map((item, i) => {
                  const epcohStart = Number(
                    item.account.data.parsed?.info.stake.delegation
                      .activationEpoch
                  );
                  const epochCurrent = Number(item.account.rentEpoch);
                  const epochAge = epochCurrent - epcohStart;
                  return (
                    <div key={i}>
                      {item.pubkey.toString()}:{" "}
                      {floor(item.initStake / LAMPORTS_PER_SOL, 2)},{" "}
                      {floor(item.account.lamports / LAMPORTS_PER_SOL, 2)},
                      REWARD:{" "}
                      {floor(
                        (item.account.lamports - item.initStake!) /
                          LAMPORTS_PER_SOL,
                        2
                      )}
                    </div>
                  );
                })}
              {stakesTable && <>TOTAL STAKE: {floor(total_stake, 2)} SOL</>}
              <br />
              {stakesTable && (
                <>TOTAL INIT STAKE: {floor(total_init_stake, 2)} SOL</>
              )}
              <br />
              {stakesTable && <>TOTAL REWARD: {floor(total_reward, 2)} SOL</>}
              <br />
              {stakesTable && <>TOTAL RETURN: {floor(total_return, 2)}%</>}
            </Paper>
          </Grid>
          {/* Recent Deposits */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                {publicKey && balance
                  ? `Balance: ${balance / LAMPORTS_PER_SOL} SOL`
                  : ""}
              </div>
            </Paper>
          </Grid>
          {/* Recent Orders */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
              <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
              >
                Transactions: {transactionTable}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <br />
    </div>
  );
};
