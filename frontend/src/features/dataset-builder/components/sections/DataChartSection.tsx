import type { DatasetSection } from '../../services/dataset.service';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface DataChartSectionProps {
  section: DatasetSection;
  mode: 'edit' | 'preview';
  data?: unknown;
}

export const DataChartSection: React.FC<DataChartSectionProps> = ({ section, mode, data }) => {
  const chartType = (section.config?.chartType as string) || 'bar';
  const source = (section.config?.table as string) || 'N/A';
  const xField = (section.config?.xField as string) || 'x';
  const yField = (section.config?.yField as string) || 'y';

  if (mode === 'edit') {
    return (
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-foreground">{section.title}</div>
        <div className="text-muted-foreground">
          {chartType.toUpperCase()} chart from <span className="font-medium">{source}</span> using{' '}
          <span className="font-medium">{xField}</span> on X and{' '}
          <span className="font-medium">{yField}</span> on Y.
        </div>
      </div>
    );
  }

  type ChartPayload = {
    chartType?: string;
    labels?: string[];
    values?: number[];
  };

  const payload: ChartPayload | null =
    data && typeof data === 'object' ? (data as ChartPayload) : null;

  const labels = Array.isArray(payload?.labels) ? payload?.labels : [];
  const values = Array.isArray(payload?.values) ? payload?.values : [];

  const chartData =
    labels.length > 0 && values.length > 0
      ? labels.map((label, index) => ({
          label,
          value: typeof values[index] === 'number' ? (values[index] as number) : 0,
        }))
      : [];

  if (chartData.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No data available to render this chart.
      </div>
    );
  }

  const normalizedType = (payload?.chartType || chartType).toLowerCase();
  const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#EC4899', '#8B5CF6', '#14B8A6'];

  return (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-foreground">{section.title}</div>
      <div className="h-56 rounded-md border bg-muted/30 p-3">
        <div className="mb-1 text-[10px] uppercase text-muted-foreground">
          {(normalizedType || 'bar').toUpperCase()} chart
        </div>
        <ResponsiveContainer width="100%" height="100%">
          {normalizedType === 'line' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          )}
          {normalizedType === 'pie' && (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {chartData.map((entry, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
          {normalizedType === 'area' && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.25}
              />
            </AreaChart>
          )}
          {(normalizedType === 'bar' || !['line', 'pie', 'area'].includes(normalizedType)) && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};


