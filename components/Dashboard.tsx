import React from 'react';
import { LedgerEntry, EntryType, Settings } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface DashboardProps {
  entries: LedgerEntry[];
  settings: Settings;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

const Dashboard: React.FC<DashboardProps> = ({ entries, settings }) => {
  const totalCashIn = entries
    .filter(e => e.type === EntryType.CASH_IN)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCashOut = entries
    .filter(e => e.type === EntryType.CASH_OUT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalCashOut - totalCashIn;

  // Prepare data for Pie Chart
  const pieData = [
    { name: 'Cash In', value: totalCashIn },
    { name: 'Cash Out', value: totalCashOut },
  ];

  // Prepare data for Line Chart (Last 7 entries or days - simplified to just entries for demo)
  // Reversing to show oldest to newest left to right
  const lineData = [...entries].reverse().slice(-10).map(e => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: e.type === EntryType.CASH_IN ? e.amount : -e.amount,
    type: e.type
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">Total Balance</p>
            <h3 className={`text-lg md:text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {settings.currency.symbol}{balance.toFixed(2)}
            </h3>
          </div>
          <div className={`p-2 md:p-3 rounded-full ${balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
            <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">Total Cash In</p>
            <h3 className="text-lg md:text-2xl font-bold text-emerald-600">+{settings.currency.symbol}{totalCashIn.toFixed(2)}</h3>
          </div>
          <div className="p-2 md:p-3 rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">Total Cash Out</p>
            <h3 className="text-lg md:text-2xl font-bold text-rose-600">-{settings.currency.symbol}{totalCashOut.toFixed(2)}</h3>
          </div>
          <div className="p-2 md:p-3 rounded-full bg-rose-50 text-rose-600">
            <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Cash Flow Trend */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
              <span className="hidden sm:inline">Recent Transaction Trend</span>
              <span className="sm:hidden">Trend</span>
            </h3>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  dot={{r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 5}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6">Cash In vs Cash Out</h3>
          <div className="h-48 md:h-64 w-full flex items-center justify-center">
             {totalCashIn === 0 && totalCashOut === 0 ? (
                 <div className="text-gray-400 text-sm">No data to display</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;