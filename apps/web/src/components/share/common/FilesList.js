import React from 'react';
import PropTypes from 'prop-types';
import { Collapse, Divider } from '@mui/material';
import { TransitionGroup } from 'react-transition-group';

const FilesList = React.memo(({ listItems, theme }) => {
    return (
        <TransitionGroup>
            {listItems.map(item => (
                <Collapse key={item.key}>
                    {item.content}
                    <Divider sx={{ bgcolor: theme.palette.text.primary, opacity: 0.1 }} />
                </Collapse>
            ))}
        </TransitionGroup>
    );
});

FilesList.propTypes = {
    listItems: PropTypes.arrayOf(PropTypes.node).isRequired,
    theme: PropTypes.object.isRequired
}

export default React.memo(FilesList);