import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';

export async function setupPlayer() {
  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrackIndex();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
      progressUpdateEventInterval: 2,
    });

    isSetup = true;
  } finally {
    return isSetup;
  }
}

export async function addTrack(url: string, title: string, artist?: string) {
  await TrackPlayer.add({
    url: url,
    title: title,
    artist: artist || 'ETNA',
    artwork: undefined,
  });
}

export async function playTrack() {
  await TrackPlayer.play();
}

export async function pauseTrack() {
  await TrackPlayer.pause();
}

export async function stopTrack() {
  await TrackPlayer.stop();
  await TrackPlayer.reset();
}

export async function isPlaying(): Promise<boolean> {
  const state = await TrackPlayer.getPlaybackState();
  return state.state === 'playing';
}

export default TrackPlayer;
