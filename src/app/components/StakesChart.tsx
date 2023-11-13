import {
  LineChart,
} from "@mui/x-charts/LineChart";
import { FC } from "react";

export type StakesChartProps = {
  data: StakesChartData[];
};

export type StakesChartData = {
  epoch: number;
  value: number;
};
const dataset: StakesChartData[] = [
  { epoch: 0, value: 10 },
  { epoch: 1, value: 20 },
  { epoch: 100, value: 50 },
  { epoch: 200, value: 80 },
  { epoch: 300, value: 316 },
  { epoch: 400, value: 380 },
  { epoch: 500, value: 452 },
  { epoch: 600, value: 526 },
];
export const StakesChart: FC<StakesChartProps> = ({ data }) => {
  return (
    <LineChart
      width={500}
      height={300}
      series={[
        {
          dataKey: "value",
          label: "SOL",
        },
      ]}
      xAxis={[
        {
          dataKey: "epoch",
          label: "epoch",
          valueFormatter: (v) => v.toString() + " epoch",
          min: 0,
          max: 600,
        },
      ]}
      dataset={data}
    />
  );
};
