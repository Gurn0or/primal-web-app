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

export const [isHome, setIsHome] = createSignal(false);

const Layout: Component = (props) => {
  const account = useAccountContext();
