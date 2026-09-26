export enum AppEvents {
  NAVIGATE = 'NAVIGATE',
  PLAY_CHANNEL = 'PLAY_CHANNEL',
  PLAY_MOVIE = 'PLAY_MOVIE',
  PLAY_EPISODE = 'PLAY_EPISODE',
  OPEN_MOVIE_DETAILS = 'OPEN_MOVIE_DETAILS',
  OPEN_SERIES_DETAILS = 'OPEN_SERIES_DETAILS',
  STOP_PLAYBACK = 'STOP_PLAYBACK',
  SHOW_TOAST = 'SHOW_TOAST',
  SHOW_MODAL = 'SHOW_MODAL',
  CHANNEL_FAVORITE_TOGGLED = 'CHANNEL_FAVORITE_TOGGLED',
  MOVIE_FAVORITE_TOGGLED = 'MOVIE_FAVORITE_TOGGLED',
  SERIES_FAVORITE_TOGGLED = 'SERIES_FAVORITE_TOGGLED',
  PLAYLIST_SYNCED = 'PLAYLIST_SYNCED',
  LOGOUT = 'LOGOUT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  NETWORK_STATUS_CHANGED = 'NETWORK_STATUS_CHANGED'
}

type EventCallback = (data?: any) => void;

export class EventBus {
  private static listeners: Map<string, EventCallback[]> = new Map();

  public static on(event: AppEvents | string, callback: EventCallback): () => void {
    const list = this.listeners.get(event) || [];
    list.push(callback);
    this.listeners.set(event, list);

    return () => {
      this.off(event, callback);
    };
  }

  public static off(event: AppEvents | string, callback: EventCallback): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(event, list.filter((cb) => cb !== callback));
  }

  public static emit(event: AppEvents | string, data?: any): void {
    const list = this.listeners.get(event);
    if (!list) return;
    list.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[EventBus] Error in handler for event ${event}:`, e);
      }
    });
  }
}
