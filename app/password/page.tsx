import ActionForm from "@/components/ActionForm";
import { changePassword, restoreBackup } from "@/lib/actions";

export default function PasswordPage() {
  return (
    <div className="space-y-6">
    <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
      <h1 className="text-lg font-semibold text-[#3d1a10]">Change Password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter your security code and a new password. You can change the password as many
        times as you want — there is no limit.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        The password is used to confirm deletion of money entries, expenses, and ingredient
        records.
      </p>
      <ActionForm
        action={changePassword}
        submitLabel="Change password"
        className="mt-4 grid max-w-md gap-3"
      >
        <label className="grid gap-1 text-sm font-medium">
          Security code
          <input
            name="code"
            type="password"
            required
            placeholder="Enter code"
            autoComplete="off"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          New password
          <input
            name="newPassword"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Confirm new password
          <input
            name="confirm"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </ActionForm>
    </section>

    <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#3d1a10]">Back up &amp; restore</h2>
      <p className="mt-1 text-sm text-gray-500">
        Download a backup file with every product, money entry, expense, and ingredient
        record. Keep the file somewhere safe (USB drive, phone, computer).
      </p>
      <a
        href="/api/backup"
        className="mt-4 inline-block rounded-full bg-[#e7549d] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#d13f88]"
      >
        ⬇ Download backup (JSON)
      </a>
      <p className="mt-4 text-sm font-semibold text-red-600">Restore replaces everything.</p>
      <p className="mt-1 text-sm text-gray-500">
        Restoring a backup <strong>deletes all current data</strong> and replaces it with
        the file&apos;s contents. Your password is required. If anything is wrong with the
        file, nothing is changed.
      </p>
      <ActionForm
        action={restoreBackup}
        submitLabel="Restore backup (replace all data)"
        variant="danger"
        className="mt-4 grid max-w-md gap-3"
      >
        <label className="grid gap-1 text-sm font-medium">
          Backup file (.json)
          <input
            name="file"
            type="file"
            accept=".json,application/json"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            placeholder="password"
            autoComplete="off"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </ActionForm>
    </section>
    </div>
  );
}
