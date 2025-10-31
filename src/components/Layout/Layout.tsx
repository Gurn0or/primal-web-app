import { Component, createEffect, createSignal, JSX, Show, on, onMount } from 'solid-js';
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

const Layout: Component<{ children?: JSX.Element }> = (props) => {
  const intl = useIntl();
  const location = useLocation();
  const account = useAccountContext();
  const app = useAppContext();

  const [sidebarVisible, setSidebarVisible] = createSignal(true);

  createEffect(
    on(
      () => location.pathname,
      (pathname) => {
        const hideSidebarPaths = [
          '/messages',
          '/settings',
          '/help',
        ];

        const shouldHideSidebar = hideSidebarPaths.some((path) =>
          pathname.startsWith(path)
        );

        setSidebarVisible(!shouldHideSidebar);
      },
    ),
  );

  onMount(() => {
    // Any initialization logic
  });

  return (
    <div class={styles.layout}>
      <Show
        when={!isPhone()}
        fallback={
          <LayoutPhone sidebarVisible={sidebarVisible()}>
            {props.children}
          </LayoutPhone>
        }
      >
        <LayoutDesktop sidebarVisible={sidebarVisible()}>
          {props.children}
        </LayoutDesktop>
      </Show>

      <Show when={app?.showZapAnimation}>
        <ZapAnimation
          src={zapMD}
          onComplete={() => app?.actions.setShowZapAnimation(false)}
        />
      </Show>

      <Show when={app?.showCustomZapModal}>
        <CustomZap />
      </Show>

      <Show when={app?.showReactionsModal}>
        <ReactionsModal />
      </Show>

      <Show when={app?.showNoteContextMenu}>
        <NoteContextMenu />
      </Show>

      <Show when={app?.showNoteVideoContextMenu}>
        <NoteVideoContextMenu />
      </Show>

      <Show when={app?.showArticleOverviewContextMenu}>
        <ArticleOverviewContextMenu />
      </Show>

      <Show when={app?.showArticleDraftContextMenu}>
        <ArticleDraftContextMenu />
      </Show>

      <Show when={app?.showLivestreamContextMenu}>
        <LivestreamContextMenu />
      </Show>

      <Show when={app?.showLnQrCodeModal}>
        <LnQrCodeModal />
      </Show>

      <Show when={app?.showCashuQrCodeModal}>
        <CashuQrCodeModal />
      </Show>

      <Show when={app?.showProfileQrCodeModal}>
        <ProfileQrCodeModal />
      </Show>

      <Show when={app?.showReportContentModal}>
        <ReportContentModal />
      </Show>

      <Show when={app?.showConfirmModal}>
        <ConfirmModal />
      </Show>

      <Show when={app?.showSubscribeToAuthorModal}>
        <SubscribeToAuthorModal />
      </Show>

      <Show when={app?.showEnterPinModal}>
        <EnterPinModal />
      </Show>

      <Show when={app?.showCreateAccountModal}>
        <CreateAccountModal />
      </Show>

      <Show when={app?.showLoginModal}>
        <LoginModal />
      </Show>

      <Show when={app?.showTooLongToast}>
        <TooLongToast />
      </Show>
    </div>
  );
};

export default Layout;
