import ActionForm from "@/components/ActionForm";
import { changePassword } from "@/lib/actions";

export default function PasswordPage() {
  return (
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
  );
}
