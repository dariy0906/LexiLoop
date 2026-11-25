"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Download,
  LogOut,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useLibrary } from "@/features/library-context";
import { api } from "@/lib/client";

type ReminderStatus = "checking" | "enabled" | "disabled";
type AndroidBridge = { postMessage(message: string): void };
type AndroidWindow = Window & { ReactNativeWebView?: AndroidBridge };
type ReminderMessage = { type?: string; enabled?: boolean; reason?: string };

function getAndroidBridge(): AndroidBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as AndroidWindow).ReactNativeWebView;
}

export default function Profile() {
  const router = useRouter();
  const { user, categories, refresh } = useLibrary();
  const [name, setName] = useState(user.display_name || "");
  const [goal, setGoal] = useState(user.daily_review_goal || 10);
  const [language, setLanguage] = useState(user.language_preference || "en");
  const [research, setResearch] = useState(user.research_enabled || false);
  const [code, setCode] = useState(user.participant_code || "");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reminderStatus, setReminderStatus] =
    useState<ReminderStatus>("checking");
  const [reminderNotice, setReminderNotice] = useState("");

  useEffect(() => {
    const bridge = getAndroidBridge();
    if (bridge)
      bridge.postMessage(
        JSON.stringify({ type: "lexiloop-reminder-status-request" }),
      );

    const receiveReminderStatus = (event: Event) => {
      const { data } = event as MessageEvent<unknown>;
      if (typeof data !== "string") return;
      let message: ReminderMessage;
      try {
        message = JSON.parse(data) as ReminderMessage;
      } catch {
        return;
      }
      if (message.type !== "lexiloop-reminder-status") return;
      setReminderStatus(message.enabled ? "enabled" : "disabled");
      if (message.reason === "denied") {
        setReminderNotice(
          "Notifications are blocked. Allow them in Android Settings → Apps → LexiLoop → Notifications.",
        );
      } else if (message.enabled) {
        setReminderNotice(
          "24-hour reminder is on. It starts when you leave the app and resets when you return.",
        );
      }
    };

    window.addEventListener("message", receiveReminderStatus);
    document.addEventListener("message", receiveReminderStatus);
    return () => {
      window.removeEventListener("message", receiveReminderStatus);
      document.removeEventListener("message", receiveReminderStatus);
    };
  }, []);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api("/profile", "PATCH", {
        display_name: name,
        daily_review_goal: Number(goal),
        language_preference: language,
        research_enabled: research,
        participant_code: research ? code || null : null,
      });
      await refresh();
      setNotice("Settings saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save settings.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    if (!category.trim()) return;
    try {
      await api("/categories", "POST", { name: category.trim() });
      setCategory("");
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add category.",
      );
    }
  }

  async function renameCategory(id: string, current: string) {
    const next = prompt("Category name", current);
    if (!next || next === current) return;
    try {
      await api(`/categories/${id}`, "PATCH", { name: next });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not rename.");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Words will stay in your notebook."))
      return;
    try {
      await api(`/categories/${id}`, "DELETE");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete.");
    }
  }

  async function signOut() {
    await api("/auth/signout", "POST");
    router.replace("/sign-in");
    router.refresh();
  }

  function enableReminder() {
    const bridge = getAndroidBridge();
    if (!bridge) {
      setReminderNotice(
        "Install and open the Android APK first. The 24-hour reminder runs in the LexiLoop Android app.",
      );
      return;
    }
    setReminderNotice("Android is asking for notification permission…");
    bridge.postMessage(JSON.stringify({ type: "lexiloop-reminder-enable" }));
  }

  return (
    <div className="page-stack narrow-page">
      <div className="page-heading">
        <span className="eyebrow">YOUR LEARNING SPACE</span>
        <h1>Profile &amp; settings</h1>
        <p>Make LexiLoop work for you.</p>
      </div>

      <div className="panel form-panel">
        <div className="panel-heading">
          <div>
            <h2>Account</h2>
            <p className="muted">
              Your site account is stored in its own PostgreSQL database.
            </p>
          </div>
          <Settings2 size={22} />
        </div>
        <label className="field">
          Display name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
          />
        </label>
        <label className="field">
          Email address
          <input value={user.email} disabled />
        </label>
        <div className="form-grid">
          <label className="field">
            Daily review goal
            <select
              value={goal}
              onChange={(event) => setGoal(Number(event.target.value))}
            >
              {[5, 10, 20, 30, 50].map((value) => (
                <option key={value} value={value}>
                  {value} reviews
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Preferred language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="kk">Қазақша</option>
            </select>
          </label>
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={research}
            onChange={(event) => setResearch(event.target.checked)}
          />{" "}
          Take part in research analytics
        </label>
        {research && (
          <label className="field">
            Participant code (optional)
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={32}
            />
          </label>
        )}
        {error && <div className="error-box">{error}</div>}
        {notice && <p className="correct-text">{notice}</p>}
        <div className="form-actions">
          <button
            className="button button-primary"
            disabled={busy}
            onClick={save}
          >
            <Save size={17} />
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>

      <div className="panel form-panel">
        <div className="panel-heading">
          <div>
            <h2>LexiLoop for Android</h2>
            <p className="muted">
              Install the app, then let LexiLoop remind you after 24 hours away.
            </p>
          </div>
          <Bell size={22} />
        </div>
        <div className="heading-actions">
          <a
            href="/downloads/lexiloop-android.apk"
            download
            className="button button-primary"
            aria-label="Download LexiLoop Android APK"
          >
            <Download size={16} /> Download APK
          </a>
          <button
            className="button button-outline"
            onClick={enableReminder}
            disabled={reminderStatus === "enabled"}
          >
            <Bell size={16} />
            {reminderStatus === "enabled"
              ? "24-hour reminder on"
              : "Enable 24-hour reminder"}
          </button>
        </div>
        {reminderStatus === "enabled" && (
          <p className="correct-text">
            <CheckCircle2 size={16} /> Reminder enabled in this Android app.
          </p>
        )}
        {reminderNotice && <p className="muted">{reminderNotice}</p>}
        <ol className="profile-instructions">
          <li>
            <strong>Download APK</strong> and open it from your Android
            browser&apos;s Downloads list.
          </li>
          <li>
            When Android asks, tap <strong>Settings</strong> and allow installs
            from this browser, then return and tap <strong>Install</strong>.
          </li>
          <li>
            Open LexiLoop, go to <strong>Profile</strong>, and choose{" "}
            <strong>Enable 24-hour reminder</strong>. Tap <strong>Allow</strong>{" "}
            in Android&apos;s notification dialog.
          </li>
          <li>
            If you previously denied it, open{" "}
            <strong>Android Settings → Apps → LexiLoop → Notifications</strong>{" "}
            and turn on notifications.
          </li>
        </ol>
        <p className="muted small">
          The reminder is local to the Android app: it is scheduled when you
          leave LexiLoop, fires once after 24 hours, and is cancelled when you
          return.
        </p>
      </div>

      <div className="panel form-panel">
        <h2>Categories</h2>
        <p className="muted">Keep your vocabulary organized by topic.</p>
        <div className="category-add">
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addCategory();
            }}
            placeholder="New category"
            maxLength={80}
          />
          <button className="button button-primary" onClick={addCategory}>
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="category-list">
          {categories.map((item) => (
            <div key={item.id}>
              <strong>{item.name}</strong>
              <div>
                <button
                  className="text-link"
                  onClick={() => void renameCategory(item.id, item.name)}
                >
                  Rename
                </button>
                <button
                  className="danger-link"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => void deleteCategory(item.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel form-panel">
        <h2>Your data</h2>
        <p className="muted">
          Export your words to CSV or JSON. Site data is separate from the
          mobile app.
        </p>
        <div className="heading-actions">
          <Link
            href="/vocabulary/import-export"
            className="button button-outline"
          >
            <Download size={16} /> Export vocabulary
          </Link>
          <button className="button button-quiet" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
