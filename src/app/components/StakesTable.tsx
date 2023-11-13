import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  createTheme,
  Popover,
  Typography,
} from "@mui/material";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState, useCallback, useEffect } from "react";
import { floor } from "../utils";

const SEC = 1e3;
const MIN = SEC * 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;

export type StakesTableProps = {
  data: StakesTableItem[];
};

export type StakesTableItem = {
  pubkey?: string;
  initStake?: number;
  stake?: number;
  reward?: number;
  activationEpoch?: number,
  rentEpoch?: number,
  blockTime?: number,
};

export const StakesTable: FC<StakesTableProps> = ({ data }) => {
  const [isPopOpen, setPop] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const theme = createTheme();
  const palette = theme.palette;

  const getPubkeyClickHandler = useCallback(
    (pubkey) => {
      return (event) => {
        setAnchorEl(event.currentTarget);
        navigator.clipboard.writeText(pubkey);
        setPop(true);
      };
    },
    [setPop]
  );

  useEffect(() => {
    if (!isPopOpen) return;
    setTimeout(() => {
      setPop(false);
    }, 1000);
  }, [isPopOpen]);

  if (!data || data.length === 0) return <></>;
  return (
    <TableContainer component={Paper} sx={{mb: 2}}>
      <Table >
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Pubkey
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Duration (Days)
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              InitStake
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Stake
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Reward
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              BlockTime
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.sort((a, b) => b?.blockTime - a?.blockTime).map((item) => {
            const visibleLengthSize = 4;
            let date = new Date(item.blockTime! * 1000).toLocaleDateString(
              "ru-RU"
            );
            let duration = new Date().getTime() - item.blockTime! * 1000;
            return (
              <TableRow key={item.pubkey}>
                <TableCell
                  aria-describedby={"StakesTableClipboardPopover"}
                  onClick={getPubkeyClickHandler(item.pubkey)}
                >
                  {item.pubkey?.slice(0, visibleLengthSize)} ...{" "}
                  {item.pubkey?.slice(
                    item.pubkey?.length - visibleLengthSize,
                    item.pubkey?.length
                  )}
                </TableCell>
                <TableCell>
                  {floor(duration / DAY, 0)}
                </TableCell>
                <TableCell>
                  {floor(item.initStake / LAMPORTS_PER_SOL, 2)}
                </TableCell>
                <TableCell>{floor(item.stake / LAMPORTS_PER_SOL, 2)}</TableCell>
                <TableCell>
                  {floor(item.reward / LAMPORTS_PER_SOL, 2)}
                  ({floor((item.reward / item.initStake) * 100, 2)}%)
                </TableCell>
                <TableCell>
                  {date}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Popover
        id={"StakesTableClipboardPopover"}
        open={isPopOpen}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        disableScrollLock
      >
        <Typography sx={{ p: 2 }}>Copied to clipboard!</Typography>
      </Popover>
    </TableContainer>
  );
};
