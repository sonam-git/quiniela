const axios = require('axios');

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

const apiFootball = axios.create({
  baseURL: API_FOOTBALL_BASE_URL,
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY
  }
});

/**
 * Get fixtures (matches) for a specific league and season
 * @param {number} league - League ID (e.g., 140 for La Liga)
 * @param {number} season - Season year (e.g., 2025)
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 */
const getFixtures = async (league, season, from, to) => {
  try {
    const response = await apiFootball.get('/fixtures', {
      params: {
        league,
        season,
        from,
        to
      }
    });
    return response.data.response;
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get fixtures for current round of a league
 * @param {number} league - League ID
 * @param {number} season - Season year
 * @param {string} round - Round name (e.g., "Regular Season - 20")
 */
const getFixturesByRound = async (league, season, round) => {
  try {
    const response = await apiFootball.get('/fixtures', {
      params: {
        league,
        season,
        round
      }
    });
    return response.data.response;
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get current round for a league
 * @param {number} league - League ID
 * @param {number} season - Season year
 */
const getCurrentRound = async (league, season) => {
  try {
    const response = await apiFootball.get('/fixtures/rounds', {
      params: {
        league,
        season,
        current: true
      }
    });
    return response.data.response[0];
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get live fixtures
 * @param {number} league - League ID (optional)
 */
const getLiveFixtures = async (league = null) => {
  try {
    const params = { live: 'all' };
    if (league) params.league = league;
    
    const response = await apiFootball.get('/fixtures', { params });
    return response.data.response;
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get fixture by ID
 * @param {number} fixtureId - Fixture ID
 */
const getFixtureById = async (fixtureId) => {
  try {
    const response = await apiFootball.get('/fixtures', {
      params: { id: fixtureId }
    });
    return response.data.response[0];
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get available leagues
 */
const getLeagues = async () => {
  try {
    const response = await apiFootball.get('/leagues');
    return response.data.response;
  } catch (error) {
    console.error('API Football error:', error.response?.data || error.message);
    throw error;
  }
};

// Popular League IDs
const LEAGUES = {
  LA_LIGA: 140,
  PREMIER_LEAGUE: 39,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  MLS: 253,
  LIGA_MX: 262
};

module.exports = {
  getFixtures,
  getFixturesByRound,
  getCurrentRound,
  getLiveFixtures,
  getFixtureById,
  getLeagues,
  LEAGUES
};
