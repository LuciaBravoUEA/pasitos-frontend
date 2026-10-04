import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { scheduleRoutineReminder } from './routineReminders';
import { areSystemNotificationsEnabled, checkNotificationPermission } from './notificationPermission';

vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: { createChannel: vi.fn(), listChannels: vi.fn(), schedule: vi.fn() } }));
vi.mock('./notificationPermission', () => ({ isNotificationsCapabilityAvailable: () => true, checkNotificationPermission: vi.fn(), areSystemNotificationsEnabled: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
  vi.mocked(checkNotificationPermission).mockResolvedValue('granted');
  vi.mocked(areSystemNotificationsEnabled).mockResolvedValue(true);
  vi.mocked(LocalNotifications.listChannels).mockResolvedValue({ channels: [] });
});
const routine = { id: 'id', title: 'Leer' };
const future = () => new Date(Date.now() + 60000);

describe('programación segura de recordatorios', () => {
  it('crea el canal antes del aviso y nunca usa alarma exacta', async () => {
    await scheduleRoutineReminder(routine, future());
    expect(vi.mocked(LocalNotifications.createChannel).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(LocalNotifications.schedule).mock.invocationCallOrder[0]);
    expect(LocalNotifications.schedule).toHaveBeenCalledWith(expect.objectContaining({ notifications: [expect.objectContaining({ isExactNotification: false, channelId: 'routine-reminders' })] }));
  });
  it('recomprueba el permiso y no agenda cuando fue revocado', async () => {
    await scheduleRoutineReminder(routine, future());
    vi.mocked(checkNotificationPermission).mockResolvedValue('denied');
    await expect(scheduleRoutineReminder(routine, future())).rejects.toThrow();
    expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
  });
  it('no confirma un aviso si el canal está desactivado', async () => {
    vi.mocked(LocalNotifications.listChannels).mockResolvedValue({ channels: [{ id: 'routine-reminders', name: 'Rutinas', importance: 0 }] });
    await expect(scheduleRoutineReminder(routine, future())).rejects.toThrow();
    expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  });
  it('en iOS no llama a la API de canales Android', async () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    await scheduleRoutineReminder(routine, future());
    expect(LocalNotifications.createChannel).not.toHaveBeenCalled();
    expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
  });
});
