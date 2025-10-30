import { Component, lazy } from 'solid-js';
import { Router, Route, Navigate, cache } from "@solidjs/router";
import { PrimalWindow } from './types/primal';
import { fetchKnownProfiles } from './lib/profile';
import { useHomeContext } from './contexts/HomeContext';
import { useExploreContext } from './contexts/ExploreContext';
import { useThreadContext } from './contexts/ThreadContext';
import { useAccountContext } from './contexts/AccountContext';
import { useProfileContext } from './contexts/ProfileContext';
import { useSettingsContext } from './contexts/SettingsContext';
import { useMediaContext } from './contexts/MediaContext';
import { useNotificationsContext } from './contexts/NotificationsContext';
import { useSearchContext } from './contexts/SearchContext';
import { useDMContext } from './contexts/DMContext';
import { generateNsec, nip19 } from './lib/nTools';
import Blossom from './pages/Settings/Blossom';

const Home = lazy(() => import('./pages/Home'));
const Reads = lazy(() => import('./pages/Reads'));
const Layout = lazy(() => import('./components/Layout/Layout'));
// const Explore = lazy(() => import('./pages/Explore'));
const Explore = lazy(() => import('./pages/Explore/Explore'));
const ExploreFeeds = lazy(() => import('./pages/Explore/ExploreFeeds'));
const Thread = lazy(() => import('./pages/Thread'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Help = lazy(() => import('./pages/Help'));
const Search = lazy(() => import('./pages/Search'));
const NotFound = lazy(() => import('./pages/NotFound'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Profile = lazy(() => import('./pages/Profile'));
const Mutelist = lazy(() => import('./pages/Mutelist'));
const CreateAccount = lazy(() => import('./pages/CreateAccount')); 
const NotifSettings = lazy(() => import('./pages/Settings/Notifications'));
const Account = lazy(() => import('./pages/Settings/Account'));
const HomeFeeds = lazy(() => import('./pages/Settings/HomeFeeds'));
const ReadsFeeds = lazy(() => import('./pages/Settings/ReadsFeeds'));
const ZapSettings = lazy(() => import('./pages/Settings/Zaps'));
const Muted = lazy(() => import('./pages/Settings/Muted'));
const Network = lazy(() => import('./pages/Settings/Network'));
const Moderation = lazy(() => import('./pages/Settings/Moderation'));
const NostrWalletConnect = lazy(() => import('./pages/Settings/NostrWalletConnect'));
const Menu = lazy(() => import('./pages/Settings/Menu'));
// const Landing = lazy(() => import('./pages/Landing'));
const AppDownloadQr = lazy(() => import('./pages/appDownloadQr'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Feeds = lazy(() => import('./pages/Feeds'));
const Feed = lazy(() => import('./pages/Feed'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const AdvancedSearchResults = lazy(() => import('./pages/AdvancedSearchResults'));
const Streaming = lazy(() => import('./pages/Streaming'));
const CitadelPage = lazy(() => import('./pages/CitadelPage'));

export type PrimalRoute = {
  path: string,
  title: string,
  logo: string,
  ltr?: string,
};

const routes: PrimalRoute[] = [
  { path: '/', title: 'Home', logo: 'feed', ltr: 'feed_ltr' },
  { path: '/bookmarks', title: 'Bookmarks', logo: 'bookmark' },
  { path: '/reads', title: 'Reads', logo: 'explore' },
  { path: '/notifications', title: 'Notifications', logo: 'notifications' },
  { path: '/dms', title: 'Messages', logo: 'messages' },
  { path: '/downloads', title: 'Downloads', logo: 'downloads' },
  { path: '/settings', title: 'Settings', logo: 'settings' },
  { path: '/help', title: 'Help', logo: 'help' },
];

export const pagesWithoutLayout = [
  '/rc',
  '/app-download-qr',
  '/terms',
  '/privacy',
  '/citadel_stream',
];

const getKnownProfiles = cache(async () => {
  return await fetchKnownProfiles();
}, 'knownProfiles');

const AppRouter: Component = () => {
  const account = useAccountContext();
  const home = useHomeContext();
  const explore = useExploreContext();
  const profile = useProfileContext();
  const settings = useSettingsContext();
  const media = useMediaContext();
  const thread = useThreadContext();
  const notifications = useNotificationsContext();
  const search = useSearchContext();
  const dms = useDMContext();

  if (!account || !home || !explore || !thread || !profile || !settings || !media || !notifications || !search || !dms) {
    return ;
  }

  (window as PrimalWindow).routes = routes;
  (window as PrimalWindow).pagesWithoutLayout = pagesWithoutLayout;

  return (
    <Router>
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/rc/:code?" component={() => <Navigate href="/app-download-qr" />}/>
      <Route path="/app-download-qr" component={AppDownloadQr} />
      <Route path="/" component={Layout}>
        <Route path="/" component={Home} />
        <Route path="/reads" component={Reads} />
        <Route path="/reads/:article" component={Reads} />
        <Route path="/e/:id" component={Thread} />
        <Route path="/explore" component={Explore} />
        <Route path="/explore/:scope" component={Explore} />
        <Route path="/explore-feeds/:topic?" component={ExploreFeeds} />
        <Route path="/dms" component={() => <Navigate href="/dms/all" />} />
        <Route path="/dms/:contact?" component={DirectMessages} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/download" component={() => <Navigate href="/downloads" />} />;
        <Route path="/settings" component={Settings}>
          <Route path="/" component={Menu} />
          <Route path="/account" component={Account} />
          <Route path="/home_feeds" component={HomeFeeds} />
          <Route path="/reads_feeds" component={ReadsFeeds} />
          <Route path="/notifications" component={NotifSettings} />
          <Route path="/zaps" component={ZapSettings} />
          <Route path="/muted" component={Muted} />
          <Route path="/network" component={Network} />
          <Route path="/filters" component={Moderation} />
          <Route path="/nwc" component={NostrWalletConnect} />
          <Route path="/uploads" component={Blossom} />
        </Route>
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/settings/breez-wallet" component={lazy(() => import('./pages/Settings/BreezWallet'))} />
        <Route path="/settings/profile" component={EditProfile} />
        <Route path="/profile/:npub?" component={Profile} />
        <Route path="/p/:npub?">
          <Route path="/" component={Profile} />
          <Route path="/live/streamId?" component={Streaming} />
        </Route>
        <Route path="/help" component={Help} />
        {/* <Route path="/search/:query" component={Search} /> */}
        {/* <Route path="/rest" component={Explore} /> */}
        <Route path="/mutelist/:npub" component={Mutelist} />
        <Route path="/new" component={CreateAccount} />
        <Route path="/feeds">
          <Route path="/" component={Feeds} />
          <Route path="/:query" component={Feed} />
        </Route>
        <Route path="/search">
          <Route path="/" component={AdvancedSearch} />
          <Route path="/:query" component={AdvancedSearchResults} />
        </Route> 
        <Route path="/:vanityName">
          <Route path="/" component={Profile} preload={getKnownProfiles} />
          <Route path="/live/:streamId?" component={Streaming} />
          <Route path="/:identifier" component={Thread} preload={getKnownProfiles} />
        </Route>
        <Route path="/rc/:code?" component={() => <Navigate href="/app-download-qr" />}/>
        <Route path="/citadel_stream" component={CitadelPage} />
        <Route path="/404" component={NotFound} />
      </Route>
    </Router>
  );
};

export default AppRouter;
