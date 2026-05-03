export const mockUser = {
  name: 'Iko Setiawan',
  initials: 'IS',
  role: 'Blue Team Analyst',
  level: 'Intermediate',
  xp: 120,
  scenariosDone: 14,
  streak: 5,
  avgSessionHrs: 8,
  sessionGrowth: '+0.5%',
}

export const mockWeeklyActivity = [4, 6, 5, 8, 7, 6, 8]

export const mockTopics = [
  { name: 'Network Security', count: 4, color: '#F3F1EF', status: 'done' },
  { name: 'Endpoint Security', count: 3, color: '#D9D9D9', status: 'done' },
  { name: 'Cloud Security', count: 1, color: '#A3A3A3', status: 'active' },
  { name: 'IAM', count: 0, color: '#4B4B4B', status: 'locked' },
]

export const mockScenarios = {
  attempted: 120,
  passed: 80,
  critical: 18,
  byTopic: [
    { topic: 'Net', attempted: 28, passed: 20 },
    { topic: 'Endpt', attempted: 22, passed: 18 },
    { topic: 'Cloud', attempted: 15, passed: 10 },
    { topic: 'IAM', attempted: 18, passed: 12 },
    { topic: 'IR', attempted: 20, passed: 14 },
    { topic: 'Threat', attempted: 17, passed: 6 },
  ],
}

export const mockLeaderboard = [
  { rank: 1, initials: 'RK', name: 'Rania K.', topic: 'Network Sec.', xp: 310, status: 'Done', color: '#2F3131' },
  { rank: 2, initials: 'DL', name: 'Devon L.', topic: 'Endpoint Sec.', xp: 285, status: 'Done', color: '#3A3A3A' },
  { rank: 3, initials: 'IS', name: 'Iko S.', topic: 'Cloud Sec.', xp: 120, status: 'Active', color: '#4A4A4A', isYou: true },
  { rank: 4, initials: 'MM', name: 'Mia M.', topic: 'Threat Intel.', xp: 95, status: 'Paused', color: '#595959' },
  { rank: 5, initials: 'EP', name: 'Eli P.', topic: 'Social Eng.', xp: 60, status: 'Failed', color: '#6B6B6B' },
]
