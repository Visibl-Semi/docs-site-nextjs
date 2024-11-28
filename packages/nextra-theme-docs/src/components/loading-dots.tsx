import cn from 'clsx'

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1 items-center", className)}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue-500"
          style={{
            animation: `loadingDots 1s ease-in-out ${delay}s infinite`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes loadingDots {
          0% { opacity: 0; }
          40% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 