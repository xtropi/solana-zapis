import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  createTheme,
} from "@mui/material";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC } from "react";
import { floor } from "../utils";

export type TransactionsTableProps = {
  data: TransactionsTableItem[];
};

export type TransactionsTableItem = {
  volume?: number;
  slot?: number;
  blockTime?: number;
  status?: string;
};

export const TransactionsTable: FC<TransactionsTableProps> = ({ data }) => {
  if (!data || data.length === 0) return <></>;
  const theme = createTheme();
  const palette = theme.palette;
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{fontWeight: 'bold', fontSize: '1rem'}}>Volume</TableCell>
            <TableCell sx={{fontWeight: 'bold', fontSize: '1rem'}}>Slot</TableCell>
            <TableCell sx={{fontWeight: 'bold', fontSize: '1rem'}}>Date</TableCell>
            <TableCell sx={{fontWeight: 'bold', fontSize: '1rem'}}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => {
            let date = new Date(item.blockTime! * 1000).toLocaleDateString(
              "ru-RU"
            );

            return (
              <TableRow key={item.slot}>
                <TableCell
                  sx={{
                    color:
                      item.volume && item.volume > 0
                        ? palette.success.light
                        : palette.error.light,
                  }}
                >
                  {item.volume && floor(item.volume / LAMPORTS_PER_SOL, 2)}
                </TableCell>
                <TableCell>{item.slot?.toLocaleString()}</TableCell>
                <TableCell>{date}</TableCell>
                <TableCell
                  sx={{
                    color:
                      item.status && item.status === "Success"
                        ? palette.success.light
                        : palette.error.light,
                  }}
                >
                  {item.status}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
