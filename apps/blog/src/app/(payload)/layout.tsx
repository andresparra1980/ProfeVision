// This layout wraps all Payload admin routes
// It returns children directly without adding html/body tags
// because Payload's RootLayout provides its own html/body

export default function PayloadGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
