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
  Box,
  Autocomplete,
  ListItem,
  ListItemText
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

interface TickerOption {
  symbol: string;
  name: string;
  type: string;
  region: string;
}

const API_BASE = process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8001' : '/api');

const App: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickerOptions, setTickerOptions] = useState<TickerOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        axios.get(`${API_BASE}/search-tickers?query=${searchQuery}`)
          .then(response => setTickerOptions(response.data))
          .catch(console.error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE}/stocks/${symbol}`);
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
    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          Анализ акций {symbol}
        </Typography>

        {/* Автокомплит */}
        <Grid container spacing={3} sx={{ mb: 4 }} alignItems="center">
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={tickerOptions}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : `${option.symbol} - ${option.name}`
              }
              inputValue={searchQuery}
              onInputChange={(_, newValue) => {
                setSearchQuery(newValue);
              }}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== 'string') {
                  setSymbol(newValue.symbol);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Поиск акций"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <ListItem {...props} key={option.symbol}>
                  <ListItemText
                    primary={`${option.symbol} - ${option.name}`}
                    secondary={`${option.type} • ${option.region}`}
                  />
                </ListItem>
              )}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <DatePicker
              label="Начальная дата"
              value={startDate}
              onChange={(newValue: Date | null) => setStartDate(newValue)}
              maxDate={endDate || new Date()}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker
              label="Конечная дата"
              value={endDate}
              onChange={(newValue: Date | null) => setEndDate(newValue)}
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

        {/* График */}
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            График цен закрытия
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date: string) => format(new Date(date), 'dd.MM.yy')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: string) => format(new Date(value), 'dd.MM.yyyy')}
                formatter={(value: number) => [`$${Number(value).toFixed(2)}`, 'Цена']}
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

        {/* Таблица */}
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