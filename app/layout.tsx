import "./globals.css";
import Link from "next/link";
import { 
	ClerkProvider,
	Show,
  	SignInButton,
  	SignUpButton,
  	UserButton,
} from "@clerk/nextjs";



export const metadata = {
  	title: "AI Fitness Tracker",
  	description: "Track your workouts with pose detection",
};

export default function RootLayout({
  	children,
}: {
  	children: React.ReactNode;
}) {
  	return (
	<ClerkProvider
		appearance={{
			variables: {
				colorBackground: "#09090b",      // the popover card itself
				colorForeground: "#ffffff",      // main text
				colorMutedForeground: "#cbcbcb", // secondary text (email, labels)
				colorPrimary: "#4ade80",         // your green — buttons, links
				colorPrimaryForeground: "#09090b", // text ON the green
				colorNeutral: "#ffffff",         // borders + hover backgrounds + also effects manage acc and sign out button
				colorInput: "#18181b",
				colorInputForeground: "#ffffff",
				borderRadius: "0.25rem",
			},
			elements: {
				userButtonPopoverCard: "bg-zinc-950 border border-zinc-800 shadow-xl!",
				userButtonPopoverActionButton: "hover:bg-zinc-800 hover:text-green-400!",
				//userButtonPopoverFooter: "hidden!", // kills the "Secured by Clerk" bar
			},
		}}
	>
		<html lang="en">
			<body className={`font-arial bg-black text-white`}>

				<nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">

				<div className= "group relative inline-block inline-flex items-center gap-2">
					<span className="text-green-400 font-bold text-xl">💪 FitnessTracker</span>
					<span className="text-gray-400 font-bold text-xs">v1.0.0</span>
					{/*<span className="top-full hidden white-space-nowrap group-hover:block text-gray-400 font-bold text-xs">v1.0.0</span>*/}
				</div>

					<div className="flex gap-6">
						<Link href="/" className="text-gray-300 hover:text-green-400 transition-colors">
							Home
						</Link>
						<Link href="/tracker" className="text-gray-300 hover:text-green-400 transition-colors">
							Tracker
						</Link>
						<Show when="signed-in">
							<Link href="/dashboard" className="text-gray-300 hover:text-green-400 transition-colors">
								Dashboard
							</Link>
							<UserButton>
							</UserButton>
						</Show>
						<Show when="signed-out">
							<SignInButton>
								<button className="text-gray-300 hover:text-green-400 transition-colors">
									Sign In
								</button>
							</SignInButton>
							<SignUpButton>
								<button className="text-gray-300 hover:text-green-400 transition-colors">
									Sign Up
								</button>
							</SignUpButton>
						</Show>
					</div>
				</nav>

				{children}

			</body>
		</html>
	</ClerkProvider>
  );
}