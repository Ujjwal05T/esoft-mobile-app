import UIKit

// Newer iOS/Xcode versions hard-crash (EXC_BREAKPOINT /
// ___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption) apps that only
// implement the legacy AppDelegate window setup without adopting Scene lifecycle.
// This delegate does the window/React Native startup that used to live in
// AppDelegate.application(_:didFinishLaunchingWithOptions:).
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    appDelegate.window = window
    self.window = window

    factory.startReactNative(
      withModuleName: "esoft",
      in: window,
      launchOptions: nil
    )
  }
}
