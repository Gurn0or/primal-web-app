import { Component, createEffect, createSignal, on, onCleanup, onMount, Show } from 'solid-js';
import styles from './Layout.module.scss';
import { useBeforeLeave, useLocation, useParams } from '@solidjs/router';
import { useAccountContext } from '../../contexts/AccountContext';
import zapMD from '../../assets/lottie/zap_md.json';
import { useHomeContext } from '../../contexts/HomeContext';
import { SendNoteResult } from '../../types/primal';
import { useProfileContext } from '../../contexts/ProfileContext';
import ZapAnimation from '../ZapAnimation/ZapAnimation';
import ReactionsModal from '../ReactionsModal/ReactionsModal';
import { useAppContext } from '../../contexts/AppContext';
import CustomZap from '../CustomZap/CustomZap';
import NoteContextMenu from '../Note/NoteContextMenu';
import LnQrCodeModal from '../LnQrCodeModal/LnQrCodeModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import CashuQrCodeModal from '../CashuQrCodeModal/CashuQrCodeModal';
import SubscribeToAuthorModal from '../SubscribeToAuthorModal/SubscribeToAuthorModal';
import { useSettingsContext } from '../../contexts/SettingsContext';
import EnterPinModal from '../EnterPinModal/EnterPinModal';
import CreateAccountModal from '../CreateAccountModal/CreateAccountModal';
import LoginModal from '../LoginModal/LoginModal';
import { unwrap } from 'solid-js/store';
import { followWarning, forgotPin } from '../../translations';
import { useIntl } from '@cookbook/solid-intl';
import LayoutPhone from './LayoutPhone';
import LayoutDesktop from './LayoutDesktop';
import { isPhone } from '../../utils';
import ArticleOverviewContextMenu from '../Note/ArticleOverviewContextMenu';
import ArticleDraftContextMenu from '../Note/ArticleDraftContextMenu';
import LiveStreamContextMenu from '../Note/LiveStreamContextMenu';
import ProfileQrCodeModal from '../ProfileQrCodeModal/ProfileQrCodeModal';
import ReportContentModal from '../ReportContentModal/ReportContentModal';
import NoteVideoContextMenu from '../Note/NoteVideoContextMenu';

const Layout: Component = (props) => {
  const account = useAccountContext();
  const home = useHomeContext();
  const profile = useProfileContext();
  const app = useAppContext();
  const settings = useSettingsContext();
  const intl = useIntl();

  const location = useLocation();

  const params = useParams();

  const [isAnimating, setIsAnimating] = createSignal(false);
  const [isAnimatingZap, setIsAnimatingZap] = createSignal(false);

  let animationContainer: HTMLDivElement | undefined;
  let zapContainer: HTMLDivElement | undefined;

  const [isMessagesVisible, setMessagesVisible] = createSignal(false);
  const [followInProgress, setFollowInProgress] = createSignal<string>();
  const [confirmUnfollow, setConfirmUnfollow] = createSignal<string>();

  const onConfirmUnfollow = (pubkey: string | undefined) => {
    if (!pubkey) {
      return;
    }

    account?.actions.removeFromFollows(pubkey);
    setConfirmUnfollow(() => undefined);
  };

  createEffect(on(() => params.article, (v, p) => {
    if (v !== p) {
      home?.actions.clearArticle();
    }
  }));

  onMount(() => {
    const handleZaps = (zapEvent: SendNoteResult) => {
      if (!zapContainer) return;

      const rect = zapContainer.getBoundingClientRect();

      zapContainer.innerHTML = '';

      setIsAnimatingZap(true);

      setTimeout(() => {
        setIsAnimatingZap(false);
      }, 3_000);
    };

    if (app) {
      app.actions.setMediaDisclaimerConfirmed(account?.mediaDisclaimer?.confirmed || settings?.defaultZapAmount === account?.defaultZapAmount);
    }

    // @ts-ignore
    document.addEventListener('primal-zap-animation', handleZaps);

    onCleanup(() => {
      // @ts-ignore
      document.removeEventListener('primal-zap-animation', handleZaps);
    });
  });

  useBeforeLeave(() => {
    setMessagesVisible(false);
  });

  return (
    <div class={styles.layout}>
      <Show when={isPhone()} fallback={<LayoutDesktop />}>
        <LayoutPhone />
      </Show>

      <ReactionsModal
        noteId={app?.showReactionsFor}
        stats={app?.reactionStats}
        onClose={() => app?.actions.showReactionsModal()}
      />

      <CustomZap onConfirm={(zapOption, extraMessage, npub, invoice) => {
        account?.actions.setCustomZap(zapOption);
        account?.actions.addToAllowlist(npub);
        app?.actions.closeCustomZapModal();
        account?.actions.sendCustomZap(extraMessage, invoice);
      }}
        onSuccess={(zapOption) => {
          account?.actions.setCustomZap(zapOption);
          app?.actions.closeCustomZapModal();
        }}
        onFail={() => {
          app?.actions.closeCustomZapModal();
        }}
        onCancel={() => {
          app?.actions.closeCustomZapModal();
        }}
      />

      <NoteContextMenu
        note={app?.showContext.note}
        data={app?.showContext.data}
        position={app?.showContext.position || { x: 0, y: 0, t: '', w: 0, h: 0 }}
        onClose={() => {
          app?.actions.openContextMenu();
        }}
      />

      <ArticleOverviewContextMenu
        article={app?.articleOverview.article}
        data={app?.articleOverview.data}
        position={app?.articleOverview.position || { x: 0, y: 0, t: '', w: 0, h: 0 }}
        onClose={() => {
          app?.actions.openArticleOverview();
        }}
      />

      <ArticleDraftContextMenu
        article={app?.articleDraft.article}
        data={app?.articleDraft.data}
        position={app?.articleDraft.position || { x: 0, y: 0, t: '', w: 0, h: 0 }}
        onClose={() => {
          app?.actions.openArticleDraft();
        }}
      />

      <LiveStreamContextMenu
        article={app?.liveStreamContext.article}
        data={app?.liveStreamContext.data}
        position={app?.liveStreamContext.position || { x: 0, y: 0, t: '', w: 0, h: 0 }}
        onClose={() => {
          app?.actions.openLiveStreamContext();
        }}
      />

      <NoteVideoContextMenu
        note={app?.videoContext.note}
        data={app?.videoContext.data}
        position={app?.videoContext.position || { x: 0, y: 0, t: '', w: 0, h: 0 }}
        onClose={() => {
          app?.actions.openVideoContext();
        }}
      />

      <LnQrCodeModal
        open={app?.showLnInvoiceModal || false}
        onClose={() => {
          app?.actions.closeLnInvoiceModal();
        }}
      />

      <CashuQrCodeModal
        open={app?.showCashuInvoiceModal || false}
        onClose={() => {
          app?.actions.closeCashuInvoiceModal();
        }}
      />

      <ProfileQrCodeModal
        open={app?.showGetStarted === 'qr' || false}
        onClose={() => {
          app?.actions.closeGetStarted();
        }}
      />

      <SubscribeToAuthorModal />

      <ConfirmModal
        open={confirmUnfollow() !== undefined}
        description={intl.formatMessage(followWarning)}
        onConfirm={() => {
          onConfirmUnfollow(confirmUnfollow());
        }}
        onAbort={() => setConfirmUnfollow(() => undefined)}
      />

      <EnterPinModal
        open={app?.showPin === 'enter' || false}
        onPinEnter={(pin) => {
          account?.actions.saveSettings(pin);
          app?.actions.closePin();
        }}
        onClose={() => {
          app?.actions.closePin();
        }}
        onForgot={() => {
          app?.actions.closePin();
          account?.actions.showNewNoteForm();
          account?.actions.showGetStarted('restore');
        }}
      />

      <CreateAccountModal />

      <LoginModal />

      <ReportContentModal
        open={!!app?.showReportUserModal}
        onClose={() => app?.actions.reportUser()}
      />

      <div class={styles.animationBackground}>
        <div
          class={`${styles.animationContainer} ${isAnimatingZap() ? styles.shown : ''}`}
          ref={zapContainer}
        >
          <ZapAnimation />
        </div>
      </div>
    </div>
  );
};

export default Layout;

