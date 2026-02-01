"use client";

import { motion } from "motion/react";
import { AuthForm } from "@/components/auth";

export default function AuthPage() {
    return (
        <div className="flex min-h-svh w-full flex-1 flex-col items-center justify-center bg-background px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-sm"
            >
                <AuthForm />

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-muted-foreground/60">
                    By continuing, you agree to our{" "}
                    <a href="#" className="underline underline-offset-2 hover:text-muted-foreground">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline underline-offset-2 hover:text-muted-foreground">
                        Privacy Policy
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
