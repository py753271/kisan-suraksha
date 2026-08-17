import db from '../config/database.config';

export class DashboardRepository {
  async getOverviewStats(): Promise<any> {
    const activeAlerts = await db.alert.count({ where: { status: 'Active', deletedAt: null } });
    const pendingSOS = await db.sOSRequest.count({ where: { status: 'Pending', deletedAt: null } });
    const cropsCount = await db.crop.count({ where: { deletedAt: null } });
    const notificationUnread = await db.notification.count({ where: { status: 'Sent', deletedAt: null } });

    return {
      activeAlerts,
      pendingSOS,
      cropsCount,
      notificationUnread,
    };
  }
}

export default DashboardRepository;
