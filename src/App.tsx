import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';


interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const App: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState('IBM');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:8000/api/stocks/${symbol}`);
      setStockData(response.data.data || []);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = stockData.filter(item => {
    const itemDate = new Date(item.date);
    return (
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate)
    );
  });

  useEffect(() => {
    fetchStockData();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          Анализ акций {symbol}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Тикер"
              variant="outlined"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              fullWidth
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker
              label="Начальная дата"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              maxDate={endDate || new Date()}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker
              label="Конечная дата"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate || undefined}
              maxDate={new Date()}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={fetchStockData}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Обновить'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            График цен закрытия
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'dd.MM.yy')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Цена']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="h6" gutterBottom>
          Исторические данные
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Открытие</TableCell>
                <TableCell align="right">Максимум</TableCell>
                <TableCell align="right">Минимум</TableCell>
                <TableCell align="right">Закрытие</TableCell>
                <TableCell align="right">Объём</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>{format(new Date(day.date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell align="right">${day.open.toFixed(2)}</TableCell>
                  <TableCell align="right">${day.high.toFixed(2)}</TableCell>
                  <TableCell align="right">${day.low.toFixed(2)}</TableCell>
                  <TableCell align="right">${day.close.toFixed(2)}</TableCell>
                  <TableCell align="right">{day.volume.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default App;