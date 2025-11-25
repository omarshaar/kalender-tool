export default function MyTitle({children, className}) {
    return (
        <h2 className={`text-xl dark:text-white text-black ${className || ""} `} >{children}</h2>
    )
}