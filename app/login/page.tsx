import { LoginForm } from "@/components/login-form";

export default function LoginRoute() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-[#1c120d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="pill bg-white/10 text-white">Secure access</span>
          <h1 className="mt-8 font-serif text-5xl leading-tight">
            Sign in to Xan Bill and run billing, tables, and reports from one place.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
            Internal routes are now protected, and the restaurant workspace opens only after a
            valid sign-in.
          </p>
        </div>

      </section>

      <section className="flex min-h-screen items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md rounded-[2rem] border border-line bg-white/88 p-8 shadow-[0_24px_60px_rgba(74,40,20,0.14)]">
          <div className="pill pill-neutral">Restaurant login</div>
          <h2 className="mt-5 text-3xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sign in with your staff credentials to access the protected billing workspace.
          </p>

          <LoginForm />


        </div>
      </section>
    </main>
  );
}
