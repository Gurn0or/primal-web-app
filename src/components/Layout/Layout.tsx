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
import Help from '../../pages/Help';
import Thread from '../../pages/Thread';
import Profile from '../../pages/Profile';
import Search from '../../pages/Search';
import Notifications from '../../pages/Notifications';
import { convertToNotes } from '../../stores/note';
import { isConnected, isNotConnected, refreshSocketListeners, removeSocketListeners, socket } from '../../sockets';
import { APP_ID } from '../../App';
import { Kind } from '../../constants';
import {
  ContextChildren,
  NostrEOSE,
  NostrEvent,
  NostrEventContent,
  NostrMentionContent,
  NostrNoteActionsContent,
  NostrNoteContent,
  NostrStatsContent,
  NostrUserContent,
  PrimalNote,
  PrimalUser,
} from '../../types/primal';
import { useToastContext } from '../Toaster/Toaster';
import { hexToNpub } from '../../lib/keys';
import { sendMessage, subscribeTo } from '../../lib/sockets';
import { isVisibleInContainer } from '../../utils';
import { loadMsgCounts } from '../../lib/messages';
import { getStorage, readNotificatonTime, saveNotificatonTime, setStorage, storageAvailable } from '../../lib/localStore';
import article from '../../translations/en.json';
import Article from '../../pages/Article';
import ArticleView from '../../pages/ArticleView';
import Longform from '../../pages/Longform';
import Video from '../../pages/Video';
import Livestream from '../../pages/Livestream';
import PhotoAlbum from '../../pages/PhotoAlbum';
import Wallet from '../../pages/Wallet';
import { reset } from '../../lib/notes';

const Layout: Component<{ children?: ContextChildren }> = (props) => {

  const account = useAccountContext();
  const app = useAppContext();
  const intl = useIntl();
  const toaster = useToastContext();
  const location = useLocation();

  const [isMobileLayout, setMobileLayout] = createSignal(isPhone());

  const customZapStorageKey = () => `custom_zap_${account?.publicKey || 'anon'}`;

  const onResize = (e: Event) => {
    setMobileLayout(isPhone());
  }

  const getScrollDepth = () => {
    const scrollTop = (document.documentElement || document.body.parentNode || document.body).scrollTop;
    const scrollHeight = (document.documentElement || document.body.parentNode || document.body).scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    const scrolledAmount = scrollTop / (scrollHeight - clientHeight);
    return scrolledAmount;
  }

  const updateScrollDebounced = () => {
    if (app) {
      const scroll = getScrollDepth();
      app.actions.setScrollDepth(scroll);
    }
  };

  let debounceTimer: number = 0;

  const updateScroll = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateScrollDebounced, 200);
  };

  const restoreScrollDepth = () => {
    if (!app) return;
    setTimeout(() => {
      const scrollHeight = (document.documentElement || document.body.parentNode || document.body).scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const scrollPosition = app.scrollDepth * (scrollHeight - clientHeight);
      window.scrollTo({ top: scrollPosition });
    }, 100);
  };

  onMount(() => {
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateScroll);
  });

  createEffect(on(() => location.pathname, (pathname) => {
    if (app?.isInactive) {
      return;
    }
    window.scrollTo({ top: 0 });
  }));

  createEffect(() => {
    if (account?.isKeyLookupDone && account.publicKey) {
      app?.actions.openCustomZapModal(customZapStorageKey());
    }
  });

  createEffect(() => {
    if (account?.hasPublicKey()) {
      account.actions.setDefaultZap();
      account.actions.checkNostrKey();
      account.actions.refreshAccount();
      account.actions.setDefaultZap();
      account.actions.refreshFollowData();
      account.actions.refreshMuted();
      account.actions.refreshFollowersTiers();
      account.actions.refreshAppSettings();
      account.actions.refreshReadState();
      account.actions.checkRelays();
    }
  });

  createEffect(() => {
    if (account?.isKeyLookupDone) {
      const handler = () => {
        loadMsgCounts(account.publicKey, () => {
          account.actions.refreshMsgContacts(account.publicKey);
        });
      };
      handler();
      account.actions.refreshMsgContactsInterval(handler);
    }
  });

  let notifTimer: number = 0;

  createEffect(() => {
    if (account?.isKeyLookupDone && account.hasPublicKey()) {

      clearInterval(notifTimer);

      const handler = () => {
        const last = readNotificatonTime(account.publicKey);
        const subid = `notif_check_${APP_ID}`;
        const unsub = subscribeTo(subid, async (type, _, content) => {
          if (type === 'EOSE') {
            const now = Math.floor(Date.now() / 1000);
            saveNotificatonTime(account.publicKey, now);
            account.actions.setNotificationCount(0);
            unsub();
            return;
          }

          if (type === 'EVENT') {
            account.actions.setNotificationCount((c: number) => c + 1);
          }
        });

        sendMessage(JSON.stringify([
          "REQ",
          subid,
          { cache: ["notification_counts", { pubkey: account.publicKey, since: last }] },
        ]));
      };

      handler();
      notifTimer = setInterval(handler, 60_000);
    }
  });

  createEffect(() => {
    if (isConnected() && account?.isKeyLookupDone) {
      refreshSocketListeners(
        socket(),
        [
          account.actions.setFollowing,
          account.actions.setFollowers,
          account.actions.updateNotificationsLastSeen,
          account.actions.updateSidebar,
        ],
        [
          account.following.length,
          account.followersCount,
          account.notificationsSince,
          location.pathname,
        ]
      );
    }
  });

  createEffect(() => {
    if (account?.isKeyLookupDone) {
      app?.actions.getRecomendedReads();
      app?.actions.getLegendCustomization();
      app?.actions.checkForNewAbout();
    }
  });

  const LayoutComponent = () => {
    return (
      <Show
        when={isMobileLayout()}
        fallback={
          <LayoutDesktop
            drawerOpen={app?.sidebarOpen || false}
          />
        }
      >
        <LayoutPhone />
      </Show>
    );
  };

  return (
    <div id="central_header" class={styles.layout}>
      <LayoutComponent />
      <Show when={account?.showCustomZapModal && !app?.customZap}>
        <CustomZap
          open={account?.showCustomZapModal && !app?.customZap}
          setOpen={() => account?.actions.closeCustomZapModal()}
          storageKey={customZapStorageKey()}
        />
      </Show>
      <Show when={app?.showZapAnim}>
        <ZapAnimation
          open={app?.showZapAnim}
          setOpen={(v: boolean) => app?.actions.setShowZapAnim(v)}
          data={zapMD}
        />
      </Show>
      <Show when={account?.showReactionsModal}>
        <ReactionsModal open={account?.showReactionsModal} />
      </Show>
      <Show when={account?.noteContextMenuInfo}>
        <NoteContextMenu data={account?.noteContextMenuInfo} />
      </Show>
      <Show when={account?.noteVideoContextMenuInfo}>
        <NoteVideoContextMenu data={account?.noteVideoContextMenuInfo} />
      </Show>
      <Show when={account?.articleOverviewContextMenuInfo}>
        <ArticleOverviewContextMenu data={account?.articleOverviewContextMenuInfo} />
      </Show>
      <Show when={account?.articleDraftContextMenuInfo}>
        <ArticleDraftContextMenu data={account?.articleDraftContextMenuInfo} />
      </Show>
      <Show when={account?.livestreamContextMenuInfo}>
        <LivestreamContextMenu data={account?.livestreamContextMenuInfo} />
      </Show>
      <Show when={app?.showLnbcModal}>
        <LnQrCodeModal open={app?.showLnbcModal} />
      </Show>
      <Show when={app?.showCashuModal}>
        <CashuQrCodeModal open={app?.showCashuModal} />
      </Show>
      <Show when={app?.showNpubModal}>
        <ProfileQrCodeModal open={app?.showNpubModal} />
      </Show>
      <Show when={app?.showReportModal}>
        <ReportContentModal open={app?.showReportModal} />
      </Show>
      <Show when={app?.showConfirmModal}>
        <ConfirmModal open={app?.showConfirmModal} />
      </Show>
      <Show when={app?.showAuthorSubscribeModal}>
        <SubscribeToAuthorModal open={app?.showAuthorSubscribeModal} />
      </Show>
      <Show when={app?.showEnterPinModal}>
        <EnterPinModal open={app?.showEnterPinModal} />
      </Show>
      <Show when={app?.showGetStarted}>
        <CreateAccountModal open={app?.showGetStarted} />
      </Show>
      <Show when={app?.showLogin}>
        <LoginModal open={app?.showLogin} />
      </Show>
      <Show when={account?.quotedNote}>
        <TooLongToast
          ref={account?.quotedNote}
        />
      </Show>
    </div>
  );
};

export default Layout;
