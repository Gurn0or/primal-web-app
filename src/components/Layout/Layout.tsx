import { Component, JSX, Show, createEffect, createSignal, onMount, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { isPhone } from '../../lib/media';
import { useAccountContext } from '../../contexts/AccountContext';
import { useAppContext } from '../../contexts/AppContext';
import { useIntl } from '@cookbook/solid-intl';
import LayoutPhone from './LayoutPhone';
import LayoutDesktop from './LayoutDesktop';
import styles from './Layout.module.scss';
import ZapAnimation from '../ZapAnimation/ZapAnimation';
import zapMD from '../../assets/lottie/zap_md.json';
import CustomZap from '../CustomZap/CustomZap';
import ReactionsModal from '../ReactionsModal/ReactionsModal';
import NoteContextMenu from '../Note/NoteContextMenu';
import NoteVideoContextMenu from '../NoteVideo/NoteVideoContextMenu';
import ArticleOverviewContextMenu from '../ArticlePreview/ArticleOverviewContextMenu';
import ArticleDraftContextMenu from '../ArticlePreview/ArticleDraftContextMenu';
import LivestreamContextMenu from '../LivestreamPreview/LivestreamContextMenu';
import LnQrCodeModal from '../LnQrCodeModal/LnQrCodeModal';
import CashuQrCodeModal from '../CashuQrCodeModal/CashuQrCodeModal';
import ProfileQrCodeModal from '../ProfileQrCodeModal/ProfileQrCodeModal';
import ReportContentModal from '../ReportContentModal/ReportContentModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import SubscribeToAuthorModal from '../SubscribeToAuthorModal/SubscribeToAuthorModal';
import EnterPinModal from '../EnterPinModal/EnterPinModal';
import CreateAccountModal from '../CreateAccountModal/CreateAccountModal';
import LoginModal from '../LoginModal/LoginModal';
import TooLongToast from '../TooLongToast/TooLongToast';
import { FeedOption } from '../../types/primal';
import Home from '../../pages/Home';
import Explore from '../../pages/Explore';
import Reads from '../../pages/Reads';
import Downloads from '../../pages/Downloads';
import Messages from '../../pages/Messages';
import Bookmarks from '../../pages/Bookmarks';
import Settings from '../../pages/Settings';
import Search from '../../pages/Search';
import Thread from '../../pages/Thread';
import Profile from '../../pages/Profile';
import EditProfile from '../../pages/EditProfile';
import Notifications from '../../pages/Notifications';
import Help from '../../pages/Help';
import Verification from '../../pages/Verification';
import Signin from '../../pages/Signin';
import NotFound from '../../pages/NotFound';
import Article from '../../pages/Article';
import ArticleEditor from '../../pages/ArticleEditor';
import ProfileQrCode from '../../pages/ProfileQrCode';
import NewNote from '../../pages/NewNote';
import Drafts from '../../pages/Drafts';
import MediaUpload from '../../pages/MediaUpload';
import { Redirect, Route, Routes } from '@solidjs/router';
import SearchPage from '../../pages/SearchPage';
import WalletSettings from '../../pages/WalletSettings';
import Media from '../../pages/Media';
import MessagesNew from '../../pages/MessagesNew';
import ArticleEditorLong from '../../pages/ArticleEditorLong';
import Muted from '../../pages/Muted';
import Relays from '../../pages/Relays';
import NavSidebar from '../NavSidebar/NavSidebar';
import NavFooter from '../NavFooter/NavFooter';
import NavHeader from '../NavHeader/NavHeader';
import RightSidebar from '../RightSidebar/RightSidebar';
import { pageTitle } from '../../translations';
import { Helmet, HelmetProvider } from 'solid-helmet-async';
import SidebarStore from '../../megaFeeds/sidebar';
import { useMegaFeedContext } from '../../contexts/MegaFeedContext';
import NetworkSettings from '../../pages/NetworkSettings';

const Layout: Component<{ children: JSX.Element }> = (props) => {
  const account = useAccountContext();
  const app = useAppContext();
  const location = useLocation();
  const intl = useIntl();
  const megaFeed = useMegaFeedContext();

  const [isHome, setIsHome] = createSignal(false);

  const isAnimating = () => {
    return account?.isZapping === 'in_progress';
  };

  const isCustomZap = () => {
    return account?.isZapping === 'custom';
  };

  const onZapAnimationComplete = () => {
    account?.actions.resetZapState();
  };

  const onCustomZapClose = () => {
    account?.actions.resetZapState();
  };

  createEffect(
    on(
      () => location.pathname,
      (path) => {
        setIsHome(path === '/' || path === '/home');
      }
    )
  );

  onMount(() => {
    setIsHome(location.pathname === '/' || location.pathname === '/home');
  });

  return (
    <div class={styles.layout}>
      <HelmetProvider>
        <Helmet>
          <title>{pageTitle[location.pathname] || intl.formatMessage({ id: 'app.name', defaultMessage: 'Primal', description: 'Primal app name' })}</title>
        </Helmet>
      </HelmetProvider>
      <Show when={isPhone()}>
        <LayoutPhone>{props.children}</LayoutPhone>
      </Show>
      <Show when={!isPhone()}>
        <div class={styles.desktopWrapper}>
          <NavSidebar />
          <div class={styles.centerContent}>
            <Routes>
              <Route path="/" component={Home} />
              <Route path="/home" component={Home} />
              <Route path="/explore" component={Explore} />
              <Route path="/reads" component={Reads} />
              <Route path="/downloads" component={Downloads} />
              <Route path="/messages" component={Messages} />
              <Route path="/messages/new" component={MessagesNew} />
              <Route path="/messages/:sender" component={Messages} />
              <Route path="/bookmarks" component={Bookmarks} />
              <Route path="/settings" component={Settings} />
              <Route path="/settings/wallet" component={WalletSettings} />
              <Route path="/settings/network" component={NetworkSettings} />
              <Route path="/settings/muted" component={Muted} />
              <Route path="/settings/relays" component={Relays} />
              <Route path="/search/:query" component={SearchPage} />
              <Route path="/e/:noteId" component={Thread} />
              <Route path="/p/:npub" component={Profile} />
              <Route path="/p/:npub/followers" component={Profile} />
              <Route path="/p/:npub/following" component={Profile} />
              <Route path="/p/:npub/relays" component={Profile} />
              <Route path="/p/:npub/zaps" component={Profile} />
              <Route path="/profile" component={EditProfile} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/help" component={Help} />
              <Route path="/verification" component={Verification} />
              <Route path="/signin" component={Signin} />
              <Route path="/article/:naddr" component={Article} />
              <Route path="/a/:naddr" component={Article} />
              <Route path="/article/editor" component={ArticleEditor} />
              <Route path="/drafts" component={Drafts} />
              <Route path="/profileQr" component={ProfileQrCode} />
              <Route path="/new" component={NewNote} />
              <Route path="/media" component={Media} />
              <Route path="/media/upload" component={MediaUpload} />
              <Route path="/article/editor/:naddr" component={ArticleEditorLong} />
              <Route path="*404" component={NotFound} />
            </Routes>
          </div>
          <RightSidebar />
        </div>
      </Show>
      <Show when={isAnimating()}>
        <ZapAnimation
          src={zapMD}
          onComplete={onZapAnimationComplete}
        />
      </Show>
      <Show when={isCustomZap()}>
        <CustomZap onClose={onCustomZapClose} />
      </Show>
      <ReactionsModal />
      <NoteContextMenu />
      <NoteVideoContextMenu />
      <ArticleOverviewContextMenu />
      <ArticleDraftContextMenu />
      <LivestreamContextMenu />
      <LnQrCodeModal />
      <CashuQrCodeModal />
      <ProfileQrCodeModal />
      <ReportContentModal />
      <ConfirmModal />
      <SubscribeToAuthorModal />
      <EnterPinModal />
      <CreateAccountModal />
      <LoginModal />
      <TooLongToast />
    </div>
  );
};

export default Layout;
