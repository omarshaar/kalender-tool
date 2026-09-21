/**
 * @file Themed body-text primitive.
 */

/** A `<p>` styled with the app's base text color (light/dark aware). */
export default function MyText({children, className}) {
    return (
        <p className={`text-base text-black dark:text-darkWhite ${className || ""}`}>{children}</p>
    )
}