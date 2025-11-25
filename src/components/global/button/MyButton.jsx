export function MyButton({children, onClick, className, style}) {
    return (
        <button onClick={onClick} className={`primary-btn dark:bg-darkWhite bg-black text-white dark:text-black ${className || ""}`} style={style} > {children} </button>
    );
}