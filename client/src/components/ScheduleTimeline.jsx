import { useState, useEffect } from 'react'
import api from '../services/api'

const CalendarIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MapPinIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ScheduleTimeline = ({ eventId, onMatchClick }) => {
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState(null)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    fetchSchedule()
  }, [eventId])

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`/events/${eventId}/schedule`)
      if (response.data.success && response.data.schedule) {
        setSchedule(response.data.schedule)
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!schedule || !schedule.days || schedule.days.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedule Yet</h3>
        <p className="text-gray-600">Run auto-scheduler to generate match schedule</p>
      </div>
    )
  }

  const currentDay = schedule.days[selectedDay]
  const allCourts = Array.from(
    new Set(schedule.days.flatMap(day => day.courts.map(c => c.courtNumber)))
  ).sort((a, b) => a - b)

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getMatchesByTimeAndCourt = () => {
    const timeSlots = {}

    currentDay.courts.forEach(court => {
      court.matches.forEach(match => {
        const timeKey = new Date(match.scheduledAt).getTime()
        if (!timeSlots[timeKey]) {
          timeSlots[timeKey] = { time: match.scheduledAt, courts: {} }
        }
        timeSlots[timeKey].courts[court.courtNumber] = match
      })
    })

    return Object.values(timeSlots).sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    )
  }

  const timeSlots = getMatchesByTimeAndCourt()

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
      case 'IN_PROGRESS': return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
      case 'SCHEDULED': return 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
      default: return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }
  }

  const getMatchStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700'
      case 'SCHEDULED': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Day Navigation */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {schedule.days.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedDay === index
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="text-xs opacity-90 mb-1">Day {index + 1}</div>
            <div className="text-sm font-bold">{formatDate(day.date)}</div>
            <div className="text-xs opacity-75 mt-1">{day.matchCount} matches</div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Matches Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{currentDay.matchCount}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPinIcon className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Courts Used</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{currentDay.courts.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Matches</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedule.totalMatches}</p>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-32">
                  Time
                </th>
                {allCourts.map(courtNum => (
                  <th key={courtNum} className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Court {courtNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slotIndex} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold">{formatTime(slot.time)}</span>
                    </div>
                  </td>
                  {allCourts.map(courtNum => {
                    const match = slot.courts[courtNum]

                    if (!match) {
                      return (
                        <td key={courtNum} className="px-4 py-4">
                          <div className="text-center text-gray-300 text-xs">—</div>
                        </td>
                      )
                    }

                    return (
                      <td key={courtNum} className="px-4 py-4">
                        <div
                          onClick={() => onMatchClick && onMatchClick(match)}
                          className={`${getMatchStatusColor(match.status)} border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all group`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMatchStatusBadge(match.status)}`}>
                              {match.status === 'SCHEDULED' ? 'Scheduled' :
                               match.status === 'IN_PROGRESS' ? 'Live' :
                               match.status === 'COMPLETED' ? 'Complete' : 'Pending'}
                            </span>
                            {match.isFinalsMatch && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                                Finals
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {match.participant1?.user?.name || match.participant1?.teamName || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">vs</div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {match.participant2?.user?.name || match.participant2?.teamName || 'TBD'}
                            </div>
                          </div>

                          {match.round && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="text-xs text-gray-600">{match.round}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ScheduleTimeline
