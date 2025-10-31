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

const Layout: Component<{ children: JSX.Element }> = (props) => {
  const account = useAccountContext();
  const app = useAppContext();
  const location = useLocation();
  const intl = useIntl();
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
      <Show when={isPhone()}>
        <LayoutPhone>{props.children}</LayoutPhone>
      </Show>
      <Show when={!isPhone()}>
        <LayoutDesktop>{props.children}</LayoutDesktop>
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
    </div>
  );
};

export default Layout;
