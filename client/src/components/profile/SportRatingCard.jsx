import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getSportName = (sportId) => {
  const names = {
    badminton: 'Badminton',
    'table-tennis': 'Table Tennis',
    tennis: 'Tennis',
    squash: 'Squash'
  };
  return names[sportId] || sportId.charAt(0).toUpperCase() + sportId.slice(1);
};

const getSportEmoji = (sportId) => {
  const emojis = {
    badminton: '🏸',
    'table-tennis': '🏓',
    tennis: '🎾',
    squash: '🎾'
  };
  return emojis[sportId] || '🏆';
};

const SportRatingCard = ({ sport, userId }) => {
  const [ratingHistory, setRatingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    if (showGraph) {
      fetchRatingHistory();
    }
  }, [showGraph]);

  const fetchRatingHistory = async () => {
    try {
      const response = await api.get(`/users/${userId}/rating-history/${sport.sportId}`);
      setRatingHistory(response.data.ratingHistory);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rating history:', error);
      setLoading(false);
    }
  };

  const chartData = {
    labels: ratingHistory.map(point =>
      new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Rating',
        data: ratingHistory.map(point => point.rating),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const point = ratingHistory[context.dataIndex];
            return `Rating: ${point.rating} (${point.change >= 0 ? '+' : ''}${point.change})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  };

  const winRate = sport.wins + sport.losses > 0
    ? ((sport.wins / (sport.wins + sport.losses)) * 100).toFixed(1)
    : 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-all bg-white shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getSportEmoji(sport.sportId)}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{getSportName(sport.sportId)}</h3>
              <p className="text-sm text-gray-500">Rank #{sport.rank}</p>
            </div>
          </div>
          {sport.streak && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              sport.streak.startsWith('W')
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {sport.streak}
            </div>
          )}
        </div>

        {/* Rating Display */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
            {sport.rating}
          </span>
          <span className="text-gray-500 text-lg">rating</span>
        </div>

        {/* Win/Loss Record */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold">{sport.wins}W</span>
            <span className="text-gray-400">-</span>
            <span className="text-red-600 font-bold">{sport.losses}L</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="text-gray-600">
            Win Rate: <span className="text-gray-900 font-semibold">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <div className="p-4 bg-gray-50">
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="w-full flex items-center justify-between text-primary-600 hover:text-primary-700 transition-colors font-medium"
        >
          <span className="text-sm">Rating History</span>
          <svg
            className={`w-5 h-5 transition-transform ${showGraph ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showGraph && (
          <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : ratingHistory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                No rating history yet
              </div>
            ) : (
              <div className="h-48">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SportRatingCard;
