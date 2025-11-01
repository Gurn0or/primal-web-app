import { Component, createEffect, createSignal, on, onCleanup, onMount, Show } from 'solid-js';
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
import NoteVideoContextMenu from '../Note/NoteVideoContextMenu';
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

const Layout: Component = () => {
  const account = useAccountContext();
  const app = useAppContext();
  const intl = useIntl();
  const location = useLocation();

  const [isReady, setIsReady] = createSignal(false);

  createEffect(() => {
    if (account?.isKeyLookupDone && app?.isAppReady) {
      setTimeout(() => setIsReady(true), 100);
    }
  });

  return (
    <Show when={isReady()}>
      <div class={styles.layout}>
        <Show when={isPhone()} fallback={<LayoutDesktop />}>
          <LayoutPhone />
        </Show>
        <ZapAnimation />
        <CustomZap />
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
    </Show>
  );
};

export default Layout;
