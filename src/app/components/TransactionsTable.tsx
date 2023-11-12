import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC } from "react";
import { floor } from "../utils";

export type TransactionsTableProps = {
    data: TransactionsTableItem[]
}

export type TransactionsTableItem = {
    volume?: number,
    slot?: number,
    blockTime?: number,
    status?: string
}

export const TransactionsTable: FC<TransactionsTableProps> = ({data}) => {
  if (!data || data.length === 0) return <></>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Volume</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => {
            let date = new Date(item.blockTime! * 1000).toLocaleDateString(
              "ru-RU"
            );
            return (
              <TableRow key={item.slot}>
                <TableCell>{item.volume && floor(item.volume / LAMPORTS_PER_SOL, 2)}</TableCell>
                <TableCell>{item.slot?.toLocaleString()}</TableCell>
                <TableCell>{date}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
