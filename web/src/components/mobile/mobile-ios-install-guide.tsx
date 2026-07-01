export function MobileIosInstallGuide() {
  return (
    <div className="space-y-4 text-sm text-slate-600">
      <p>
        On iPhone and iPad, install AbilityVua Worker to your home screen for quick access — like a native app, without
        the App Store.
      </p>
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          Open <strong className="text-slate-800">app.abilityvua.com/m/today</strong> in <strong>Safari</strong> (not
          Chrome).
        </li>
        <li>
          Tap the <strong>Share</strong> button (square with arrow pointing up) at the bottom of the screen.
        </li>
        <li>
          Scroll the share sheet and tap <strong>Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong>Add</strong> — the AbilityVua icon appears on your home screen.
        </li>
      </ol>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Push notifications on iOS require iOS 16.4 or later and work best when the app is opened from the home screen
        icon. Offline check-in syncs when you return to the app with a connection.
      </p>
    </div>
  );
}
