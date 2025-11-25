export default function MyText({children, className}) {
    return (
        <p className={`text-base text-black dark:text-darkWhite ${className || ""}`}>{children}</p>
    )
}