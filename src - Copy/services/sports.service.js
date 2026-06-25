const fs = require('fs');
const path = require('path');

class SportsService {
  constructor() {
    // Load sports rules from JSON file
    const rulesPath = path.join(__dirname, '../data/sports-rules.json');
    const rulesData = fs.readFileSync(rulesPath, 'utf-8');
    this.sportsData = JSON.parse(rulesData);
  }

  /**
   * Get all available sports
   */
  getAllSports() {
    return this.sportsData.sports;
  }

  /**
   * Get a specific sport by ID
   */
  getSportById(sportId) {
    return this.sportsData.sports.find(sport => sport.id === sportId);
  }

  /**
   * Get scoring rules for a sport
   */
  getScoringRules(sportId) {
    const sport = this.getSportById(sportId);
    if (!sport) {
      throw new Error(`Sport with ID "${sportId}" not found`);
    }
    return {
      sportId: sport.id,
      sportName: sport.name,
      scoringType: sport.scoringType,
      rules: sport.rules,
      description: sport.description
    };
  }

  /**
   * Validate if a sport ID is valid
   */
  isValidSport(sportId) {
    return this.sportsData.sports.some(sport => sport.id === sportId);
  }
}

module.exports = new SportsService();
