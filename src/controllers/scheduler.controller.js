const schedulerService = require('../services/scheduler.service');
const prisma = require('../lib/prisma');

class SchedulerController {
  /**
   * Update tournament scheduling configuration
   * PATCH /tournaments/:id/schedule-config
   */
  async updateScheduleConfig(req, res, next) {
    try {
      const { id } = req.params;
      const {
        dailyStartTime,
        dailyEndTime,
        courtsAvailable,
        matchDuration,
        breakDuration,
        minRestTime,
        firstMatchDate
      } = req.body;

      const updateData = {};
      if (dailyStartTime) updateData.dailyStartTime = dailyStartTime;
      if (dailyEndTime) updateData.dailyEndTime = dailyEndTime;
      if (courtsAvailable !== undefined) updateData.courtsAvailable = parseInt(courtsAvailable);
      if (matchDuration !== undefined) updateData.matchDuration = parseInt(matchDuration);
      if (breakDuration !== undefined) updateData.breakDuration = parseInt(breakDuration);
      if (minRestTime !== undefined) updateData.minRestTime = parseInt(minRestTime);
      if (firstMatchDate) updateData.firstMatchDate = new Date(firstMatchDate);

      const tournament = await prisma.tournament.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({
        success: true,
        message: 'Scheduling configuration updated',
        tournament
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-schedule matches for an event
   * POST /events/:eventId/auto-schedule
   */
  async autoSchedule(req, res, next) {
    try {
      const { eventId } = req.params;
      const options = req.body || {};

      console.log('Auto-schedule request for event:', eventId);

      const result = await schedulerService.autoScheduleEvent(eventId, options);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Auto-schedule error:', error);
      console.error('Error stack:', error.stack);
      next(error);
    }
  }

  /**
   * Get schedule for an event
   * GET /events/:eventId/schedule
   */
  async getSchedule(req, res, next) {
    try {
      const { eventId } = req.params;

      const schedule = await schedulerService.getEventSchedule(eventId);

      res.status(200).json({
        success: true,
        ...schedule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear schedule for an event
   * DELETE /events/:eventId/schedule
   */
  async clearSchedule(req, res, next) {
    try {
      const { eventId } = req.params;

      const result = await schedulerService.clearSchedule(eventId);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchedulerController();
