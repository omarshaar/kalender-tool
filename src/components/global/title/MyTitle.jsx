/**
 * @file Themed section-title primitive.
 */

/** An `<h2>` styled with the app's title color (light/dark aware). */
export default function MyTitle({children, className}) {
    return (
        <h2 className={`text-xl dark:text-white text-black ${className || ""} `} >{children}</h2>
    )
}