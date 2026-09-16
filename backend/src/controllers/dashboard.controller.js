const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/responseHelper');

exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getDashboardData(userId);
    return success(res, 'Dashboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
