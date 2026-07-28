import React, { forwardRef } from 'react'

interface MoreGamesTileProps {
  onOpen: () => void
}

export const MoreGamesTile = forwardRef<HTMLButtonElement, MoreGamesTileProps>(
  function MoreGamesTile({ onOpen }, ref) {
    return React.createElement(
      'button',
      {
        ref,
        className: 'game-tile ready more-games-platinum',
        'data-testid': 'more-games-tile',
        type: 'button',
        onClick: onOpen,
      },
      React.createElement('span', null, 'More games'),
    )
  },
)
