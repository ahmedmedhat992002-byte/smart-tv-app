import { Channel } from '../models/Channel';
import { Category } from '../models/Category';
import { Movie, Series, Episode } from '../models/MediaContent';
import { UserCredentials } from '../models/UserCredentials';
import { PlaylistValidationStats } from '../storage/PlaylistDatabase';
import { StorageService } from '../storage/StorageService';
import { EventBus, AppEvents } from './EventBus';

export type AppRoute = 'login' | 'home' | 'livetv' | 'movies' | 'series' | 'favorites' | 'recent' | 'search' | 'settings' | 'player';

export class State {
  public static currentRoute: AppRoute = 'login';
  public static loginInfo: UserCredentials | null = null;
  public static channels: Channel[] = [];
  public static categories: Category[] = [];
  public static selectedCategoryId: string | number = 'all';

  // VOD & Series
  public static movies: Movie[] = [];
  public static series: Series[] = [];
  public static vodCategories: Category[] = [];
  public static seriesCategories: Category[] = [];
  public static selectedVodCategoryId: string | number = 'all';
  public static selectedSeriesCategoryId: string | number = 'all';

  // Currently playing media
  public static currentPlayingChannel: Channel | null = null;
  public static currentPlayingMovie: Movie | null = null;
  public static currentPlayingEpisode: Episode | null = null;

  // Validation / Diagnostics Stats
  public static stats?: PlaylistValidationStats;

  public static init(): void {
    this.loginInfo = StorageService.getLoginInfo();
  }

  public static getChannelsByCategory(catId: string | number): Channel[] {
    const idStr = String(catId).trim();
    if (idStr === 'all' || !idStr) {
      return this.channels;
    }
    return this.channels.filter((ch) => String(ch.categoryId) === idStr);
  }

  public static getMoviesByCategory(catId: string | number): Movie[] {
    const idStr = String(catId).trim();
    if (idStr === 'all' || !idStr) {
      return this.movies;
    }
    return this.movies.filter((m) => String(m.categoryId) === idStr);
  }

  public static getSeriesByCategory(catId: string | number): Series[] {
    const idStr = String(catId).trim();
    if (idStr === 'all' || !idStr) {
      return this.series;
    }
    return this.series.filter((s) => String(s.categoryId) === idStr);
  }

  public static getFavoriteChannels(): Channel[] {
    const favs = StorageService.getFavorites();
    const favIdSet = new Set(favs.map((f) => String(f.streamId || f.id)));
    const matched = this.channels.filter((c) => favIdSet.has(String(c.streamId || c.id)));
    return matched.length > 0 ? matched : favs;
  }

  public static toggleFavorite(channel: Channel): boolean {
    const stableId = channel.streamId ? String(channel.streamId) : String(channel.id);
    const isFav = StorageService.isFavorite(stableId);

    if (isFav) {
      StorageService.removeFavorite(stableId);
      channel.isFavorite = false;
    } else {
      StorageService.addFavorite({ ...channel, id: stableId, isFavorite: true });
      channel.isFavorite = true;
    }

    EventBus.emit(AppEvents.CHANNEL_FAVORITE_TOGGLED, { channel, isFavorite: !isFav });
    return !isFav;
  }

  public static getFavoriteMovies(): Movie[] {
    const favs = StorageService.getFavoriteMovies();
    const favIdSet = new Set(favs.map((f) => String(f.streamId || f.id)));
    const matched = this.movies.filter((m) => favIdSet.has(String(m.streamId || m.id)));
    return matched.length > 0 ? matched : favs;
  }

  public static toggleFavoriteMovie(movie: Movie): boolean {
    const stableId = String(movie.streamId || movie.id);
    const isFav = StorageService.isFavoriteMovie(stableId);

    if (isFav) {
      StorageService.removeFavoriteMovie(stableId);
      movie.isFavorite = false;
    } else {
      StorageService.addFavoriteMovie({ ...movie, id: stableId, isFavorite: true });
      movie.isFavorite = true;
    }

    EventBus.emit(AppEvents.MOVIE_FAVORITE_TOGGLED, { movie, isFavorite: !isFav });
    return !isFav;
  }

  public static getFavoriteSeries(): Series[] {
    const favs = StorageService.getFavoriteSeries();
    const favIdSet = new Set(favs.map((s) => String(s.seriesId || s.id)));
    const matched = this.series.filter((s) => favIdSet.has(String(s.seriesId || s.id)));
    return matched.length > 0 ? matched : favs;
  }

  public static toggleFavoriteSeries(series: Series): boolean {
    const stableId = String(series.seriesId || series.id);
    const isFav = StorageService.isFavoriteSeries(stableId);

    if (isFav) {
      StorageService.removeFavoriteSeries(stableId);
      series.isFavorite = false;
    } else {
      StorageService.addFavoriteSeries({ ...series, id: stableId, isFavorite: true });
      series.isFavorite = true;
    }

    EventBus.emit(AppEvents.SERIES_FAVORITE_TOGGLED, { series, isFavorite: !isFav });
    return !isFav;
  }

  public static getContinueWatching(): any[] {
    return StorageService.getWatchProgressList();
  }

  public static saveWatchProgress(progress: any): void {
    StorageService.saveWatchProgress(progress);
  }

  public static getRecentChannels(): Channel[] {
    return StorageService.getRecentlyWatched();
  }

  public static addRecent(channel: Channel): void {
    StorageService.addRecentlyWatched(channel);
  }

  public static reset(): void {
    this.loginInfo = null;
    this.channels = [];
    this.categories = [];
    this.movies = [];
    this.series = [];
    this.vodCategories = [];
    this.seriesCategories = [];
    this.selectedCategoryId = 'all';
    this.selectedVodCategoryId = 'all';
    this.selectedSeriesCategoryId = 'all';
    this.currentPlayingChannel = null;
    this.currentPlayingMovie = null;
    this.currentPlayingEpisode = null;
    this.stats = undefined;
  }
}
