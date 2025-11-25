import { Box, ClickAwayListener } from "@mui/material";

export function DropMenu(props) {
    const {open, setOpen} = props;

    if (!open) {
        return <></>
    }
    
    return (
        <ClickAwayListener onClickAway={()=> setOpen(false)}>
            <Box
                className="absolute dark:bg-black rounded-md z-50"
                sx={{width: 300, padding: 2, top: "calc(100% + 15px)", right: "-10px"}}
            >
                <div className="dark:bg-black -z-10 absolute rounded-sm" style={{width: 25, height: 25, transform: "rotate(45deg)", top: "-8px", right: 10}}></div>
                <Box className="w-full h-full relative z-10">
                    {props.children}
                </Box>
            </Box>
        </ClickAwayListener>
    )
}