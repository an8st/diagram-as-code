import React from "react";
import GlobContext from "./GlobContext";
import { Backdrop, Box, IconButton, Typography, List, ListItem, Button, Badge} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';


export class Menu extends React.Component {

    static contextType = GlobContext

    constructor(props) {
        super(props);

        this.state = {
            diagrams: []
        }
    };

    render () {
        return (
            <Box>
                <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                onClick={() => {this.context.changeMenuState(false)}}
                open={this.context.data.menuState}
                >
                </Backdrop>
                <Box className={`offcanvas offcanvas-start menu ${this.context.data.menuState ? 'show' : ''}`}>
                    <Box className="offcanvas-header menu">
                        <Typography variant="h6" component="p">
                            Ваши диаграммы
                        </Typography>
                        <IconButton onClick={() => {this.context.changeMenuState(false)}}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box className="offcanvas-body menu">
                        <List className="diag-link">
                            {
                                Object.keys(this.context.data.diagrams).map((e) => {
                                    return (
                                        <ListItem key={e}>
                                            <Button
                                                onClick={()=>{this.context.changeActiveDiagram(e)}}
                                            >
                                            { this.context.data.diagrams[e].title }
                                            { this.context.data.activeDiag == e ? <span className="alert-badge ">ACTIVE</span> : ''}
                                            </Button>      
                                            <IconButton
                                                onClick={()=>{this.context.removeDiagram(e)}}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    )
                                })
                            }
                        </List>
                    </Box>
                    <Box className="menu info">
                        <b>Diagram-as-Code</b><br />
                        v. 1.3<br />
                        контакты: <a href="mailto:anvitep@mail.ru">anvitep@mail.ru</a><br />
                    </Box>
                </Box>
            </Box>
        );
    }


}