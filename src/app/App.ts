import { State, AppRoute } from './State';
import { EventBus, AppEvents } from './EventBus';
import { PlatformDetector, PlatformAdapter } from '../platform';
import { KeyHandler } from '../remote/KeyHandler';
import { FocusManager } from '../remote/FocusManager';
import { PlaylistSyncService } from '../services/PlaylistSyncService';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { LiveTvPage } from '../pages/LiveTvPage';
import { MoviesPage } from '../pages/MoviesPage';
import { SeriesPage } from '../pages/SeriesPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { RecentPage } from '../pages/RecentPage';
import { SearchPage } from '../pages/SearchPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PlayerPage } from '../pages/PlayerPage';
import { Channel } from '../models/Channel';
import { Movie, Episode } from '../models/MediaContent';
import { Logger } from '../utils/Logger';

export class App {
  private root: HTMLElement;
  private platformAdapter: PlatformAdapter;

  // Global layout components
  private sidebar: Sidebar | null = null;
  private topBar: TopBar | null = null;
  private mainArea: HTMLElement | null = null;
  private pageContainer: HTMLElement | null = null;

  // Pages
  private loginPage: LoginPage | null = null;
  private homePage: HomePage | null = null;
  private liveTvPage: LiveTvPage | null = null;
  private moviesPage: MoviesPage | null = null;
  private seriesPage: SeriesPage | null = null;
  private favoritesPage: FavoritesPage | null = null;
  private recentPage: RecentPage | null = null;
  private searchPage: SearchPage | null = null;
  private settingsPage: SettingsPage | null = null;
  private playerPage: PlayerPage | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.platformAdapter = PlatformDetector.createAdapter();
  }

  public async start(): Promise<void> {
    Logger.info('App', 'Bootstrapping application core...');

    await this.platformAdapter.initialize();
    KeyHandler.init();
    State.init();
    this.setupEventListeners();

    // Load cached playlist from IndexedDB
    const hasCached = await PlaylistSyncService.initializePlaylist();

    if (State.loginInfo && hasCached && State.channels.length > 0) {
      Logger.info('App', `Successfully loaded ${State.channels.length} channels across ${State.categories.length} categories, navigating to Home`);
      this.navigate('home');
    } else {
      Logger.info('App', 'No stored session found, navigating to Login');
      this.navigate('login');
    }
  }

  private setupEventListeners(): void {
    EventBus.on(AppEvents.NAVIGATE, (route: AppRoute) => {
      this.navigate(route);
    });

    EventBus.on(AppEvents.PLAY_CHANNEL, (channel: Channel) => {
      this.playChannel(channel);
    });

    EventBus.on(AppEvents.PLAY_MOVIE, (movie: Movie) => {
      this.playMovie(movie);
    });

    EventBus.on(AppEvents.PLAY_EPISODE, (episode: Episode) => {
      this.playEpisode(episode);
    });

    EventBus.on(AppEvents.LOGIN_SUCCESS, () => {
      this.navigate('home');
    });

    EventBus.on(AppEvents.PLAYLIST_SYNCED, () => {
      this.refreshCurrentView();
    });

    EventBus.on(AppEvents.LOGOUT, () => {
      State.reset();
      this.navigate('login');
    });

    EventBus.on(AppEvents.SHOW_TOAST, (data: { message: string; duration?: number }) => {
      Toast.show(data.message, data.duration);
    });

    EventBus.on(AppEvents.SHOW_MODAL, (options) => {
      new Modal(options).show();
    });

    KeyHandler.registerListener((key) => {
      if (key === 'BACK' as any) {
        return this.handleBackKey();
      }
      return false;
    });
  }

  private handleBackKey(): boolean {
    if (State.currentRoute === 'player') {
      if (this.playerPage) {
        this.playerPage.stop();
      }
      this.navigate('home');
      return true;
    }

    if (State.currentRoute !== 'home' && State.currentRoute !== 'login') {
      this.navigate('home');
      return true;
    }

    if (State.currentRoute === 'home') {
      new Modal({
        title: 'Exit Application',
        message: 'Are you sure you want to exit IPTV Premium Player?',
        confirmText: 'Exit',
        cancelText: 'Cancel',
        onConfirm: () => {
          this.platformAdapter.exitApp();
        }
      }).show();
      return true;
    }

    return false;
  }

  public navigate(route: AppRoute): void {
    Logger.info('App', `Navigating to: ${route}`);
    State.currentRoute = route;

    if (this.playerPage && route !== 'player') {
      this.playerPage.stop();
    }

    this.renderRoute(route);
  }

  private refreshCurrentView(): void {
    if (State.currentRoute === 'home' && this.homePage) {
      this.homePage.refresh();
    } else if (State.currentRoute === 'livetv' && this.liveTvPage) {
      this.liveTvPage.refresh();
    } else if (State.currentRoute === 'movies' && this.moviesPage) {
      this.moviesPage.refresh();
    } else if (State.currentRoute === 'series' && this.seriesPage) {
      this.seriesPage.refresh();
    } else if (State.currentRoute === 'favorites' && this.favoritesPage) {
      this.favoritesPage.refresh();
    }
  }

  private renderRoute(route: AppRoute): void {
    this.root.innerHTML = '';

    if (route === 'login') {
      if (!this.loginPage) {
        this.loginPage = new LoginPage();
      }
      this.root.appendChild(this.loginPage.getElement());
      setTimeout(() => this.loginPage?.focusInitial(), 100);
      return;
    }

    if (route === 'player') {
      if (!this.playerPage) {
        this.playerPage = new PlayerPage();
      }
      this.root.appendChild(this.playerPage.getElement());
      this.playerPage.attachRemoteControls();
      return;
    }

    if (!this.sidebar) {
      this.sidebar = new Sidebar(route);
    } else {
      this.sidebar.setActive(route);
    }

    this.mainArea = document.createElement('div');
    this.mainArea.className = 'tv-main-area';

    if (!this.topBar) {
      this.topBar = new TopBar({
        onSearch: (q) => {
          if (q && route !== 'search') {
            this.navigate('search');
          }
          if (this.searchPage) {
            this.searchPage.performSearch(q);
          }
        }
      });
    }

    this.pageContainer = document.createElement('div');
    this.pageContainer.style.cssText = 'flex: 1; overflow: hidden; display: flex; flex-direction: column;';

    switch (route) {
      case 'home':
        if (!this.homePage) {
          this.homePage = new HomePage();
        } else {
          this.homePage.refresh();
        }
        this.pageContainer.appendChild(this.homePage.getElement());
        setTimeout(() => this.homePage?.focusInitial(), 100);
        break;

      case 'livetv':
        if (!this.liveTvPage) {
          this.liveTvPage = new LiveTvPage();
        } else {
          this.liveTvPage.refresh();
        }
        this.pageContainer.appendChild(this.liveTvPage.getElement());
        setTimeout(() => this.liveTvPage?.focusInitial(), 100);
        break;

      case 'movies':
        if (!this.moviesPage) {
          this.moviesPage = new MoviesPage();
        } else {
          this.moviesPage.refresh();
        }
        this.pageContainer.appendChild(this.moviesPage.getElement());
        setTimeout(() => this.moviesPage?.focusInitial(), 100);
        break;

      case 'series':
        if (!this.seriesPage) {
          this.seriesPage = new SeriesPage();
        } else {
          this.seriesPage.refresh();
        }
        this.pageContainer.appendChild(this.seriesPage.getElement());
        setTimeout(() => this.seriesPage?.focusInitial(), 100);
        break;

      case 'favorites':
        if (!this.favoritesPage) {
          this.favoritesPage = new FavoritesPage();
        } else {
          this.favoritesPage.refresh();
        }
        this.pageContainer.appendChild(this.favoritesPage.getElement());
        setTimeout(() => this.favoritesPage?.focusInitial(), 100);
        break;

      case 'recent':
        if (!this.recentPage) {
          this.recentPage = new RecentPage();
        } else {
          this.recentPage.refresh();
        }
        this.pageContainer.appendChild(this.recentPage.getElement());
        setTimeout(() => this.recentPage?.focusInitial(), 100);
        break;

      case 'search':
        if (!this.searchPage) {
          this.searchPage = new SearchPage();
        } else {
          this.searchPage.refresh();
        }
        this.pageContainer.appendChild(this.searchPage.getElement());
        setTimeout(() => this.searchPage?.focusInitial(), 100);
        break;

      case 'settings':
        if (!this.settingsPage) {
          this.settingsPage = new SettingsPage();
        }
        this.pageContainer.appendChild(this.settingsPage.getElement());
        setTimeout(() => this.settingsPage?.focusInitial(), 100);
        break;
    }

    this.mainArea.appendChild(this.topBar.getElement());
    this.mainArea.appendChild(this.pageContainer);

    this.root.appendChild(this.sidebar.getElement());
    this.root.appendChild(this.mainArea);
  }

  private playChannel(channel: Channel): void {
    Logger.info('App', `Playing channel: ${channel.name}`);
    if (!this.playerPage) {
      this.playerPage = new PlayerPage();
    }
    this.navigate('player');
    this.playerPage.playChannel(channel);
  }

  private playMovie(movie: Movie): void {
    Logger.info('App', `Playing movie: ${movie.name}`);
    if (!this.playerPage) {
      this.playerPage = new PlayerPage();
    }
    this.navigate('player');
    this.playerPage.playMovie(movie);
  }

  private playEpisode(episode: Episode): void {
    Logger.info('App', `Playing episode: ${episode.title}`);
    if (!this.playerPage) {
      this.playerPage = new PlayerPage();
    }
    this.navigate('player');
    this.playerPage.playEpisode(episode);
  }
}
