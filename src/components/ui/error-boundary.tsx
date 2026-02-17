"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./button";

interface Props {
   children?: ReactNode;
   fallback?: ReactNode;
   className?: string;
}

interface State {
   hasError: boolean;
   error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
   public state: State = {
      hasError: false,
   };

   public static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("Uncaught error:", error, errorInfo);
   }

   private handleReset = () => {
      this.setState({ hasError: false, error: undefined });
   };

   public render() {
      if (this.state.hasError) {
         if (this.props.fallback) {
            return this.props.fallback;
         }

         return (
            <div className={`p-6 rounded-2xl bg-error-bg/30 border border-error-border/50 flex flex-col items-center justify-center text-center ${this.props.className}`}>
               <div className="w-12 h-12 rounded-full bg-error-bg text-error flex items-center justify-center mb-4">
                  <AlertCircle size={24} />
               </div>
               <h3 className="text-lg font-bold text-foreground mb-2">表示中にエラーが発生しました</h3>
               <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  一時的な不具合が発生した可能性があります。
               </p>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="rounded-xl"
               >
                  <RefreshCcw size={16} className="mr-2" />
                  再読み込み
               </Button>
            </div>
         );
      }

      return this.props.children;
   }
}
