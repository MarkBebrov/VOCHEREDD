import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
	Panel,
	PanelHeader,
	PanelHeaderBack,
	Group,
	Cell,
	List,
	Header,
	Div,
	Avatar,
	Button,
	ContentCard,
	Text,
	Title,
	ButtonGroup,
	PanelHeaderClose,
	FixedLayout,
	CellButton,
	InfoRow,
	Counter,
	setMenuItems
} from '@vkontakte/vkui';
import { Icon24Add, Icon16GearOutline, Icon28ArrowLeftOutline, Icon28ShuffleOutline, Icon28UserAddBadgeOutline } from '@vkontakte/icons';

import '@vkontakte/vkui/dist/vkui.css';



function QueueMenu({ id, goBack, queue, isUserCreator }) {

	const [menuItems, setMenuItems] = useState([]);

	const onDragStart = (event) => {
        event.dataTransfer.setData('text', event.currentTarget.dataset.itemId);
    };

    const onDragOver = (event) => {
        event.preventDefault();
    };

    const onDragEnd = (event) => {
        const targetId = Number(event.currentTarget.dataset.itemId);
        const draggedId = Number(event.dataTransfer.getData('text'));

        setMenuItems(prevItems => {
            const targetIndex = prevItems.findIndex(item => item.id === targetId);
            const draggedIndex = prevItems.findIndex(item => item.id === draggedId);

            const newItems = [...prevItems];
            newItems[draggedIndex] = prevItems[targetIndex];
            newItems[targetIndex] = prevItems[draggedIndex];

            return newItems;
        });
    };

	const [draggedItemId, setDraggedItemId] = useState(null);





const openModal = () => {
	console.log("Кнопка нажата");
};

const queueTitle = queue.title;
const queueDescription = queue.type === 'countdown' ? 'До начала' : 'Осталось времени';



useEffect(() => {
	if (isUserCreator(queue)) {
		setMenuItems([
			{ id: 1, title: 'Параметр 1 (для создателя)', description: 'Описание параметра 1' },
			{ id: 2, title: 'Параметр 2 (для создателя)', description: 'Описание параметра 2' },
		]);
	} else {
		setMenuItems([
			{ id: 1, title: 'Параметр 1 (для пользователя)', description: 'Описание параметра 1' },
			{ id: 2, title: 'Параметр 2 (для пользователя)', description: 'Описание параметра 2' },
		]);
	}
}, [isUserCreator(queue)]);

const joinQueue = async () => {
	const user = await bridge.send('VKWebAppGetUserInfo');
	setMenuItems((prevItems) => [...prevItems, { id: user.id, title: `${user.first_name} ${user.last_name}`, avatar: user.photo_100 }]);
};

return (
	<Panel id={id}>
		<PanelHeader before={<PanelHeaderBack onClick={goBack} />} after={<Avatar size={30} />}>
			Вочередь!
		</PanelHeader>

		<Group>
			<div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
				<Avatar src="https://via.placeholder.com/80" size={80} style={{ marginLeft: 16 }} />
				<div style={{ marginLeft: 16 }}>
					<Title level="2" weight="semibold">
						{queueTitle}
					</Title>
					<Text weight="regular">
						{queueDescription}
					</Text>
					<ButtonGroup style={{ marginTop: 8 }}>
						<Button mode="secondary" size="m" before={<Icon24Add />} onClick={() => { }}>
							Вступить
						</Button>
						<Button mode="tertiary" size="m" before={<Icon16GearOutline />} onClick={() => { }} />
					</ButtonGroup>
				</div>
			</div>
		</Group>

		<Group header={<Header mode="secondary">Меню</Header>}>
			<List>
				{menuItems.map((menuItem, index) => (
					<Cell
						key={menuItem.id}
						draggable
						onDragStart={onDragStart}
						onDragEnd={onDragEnd}
						onDragOver={onDragOver}
						data-item-id={menuItem.id}
						description={menuItem.description}
						before={<Avatar src={menuItem.avatar} />}
						asideContent={<Counter mode="primary">{index + 1}</Counter>}
					>
						{menuItem.title}
					</Cell>
				))}
			</List>
		</Group>
		{isUserCreator && (
			<FixedLayout vertical="bottom">
				<div
					style={{
						background: '#FFFFFF',
						height: 72,
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '12px 16px',
					}}
				>
					<Button
						mode="commerce"
						size="xl"
						style={{
							background: '#2688EB',
							borderRadius: 12,
							color: '#FFFFFF',
							padding: '12px 16px',
							flexGrow: 1,
							marginRight: 8,
							boxShadow: 'none',
							transition: 'box-shadow 0.15s ease-in-out',
						}}
						before={<Icon24Add fill="#ffffff" />}
						hoverMode="opacity"
						activeMode="opacity"
						className="queue-create-button"
						onClick={joinQueue}
					>
						Вступить в очередь
					</Button>
					<ButtonGroup>
						<Button
							mode="commerce"
							size="xl"
							before={<Icon28ShuffleOutline fill="#ffffff" />}
							style={{
								width: 50,
								height: 50,
								borderRadius: 12,
								marginLeft: 8,
								background: '#2688EB'
							}}
						/>
						<Button
							mode="commerce"
							size="xl"
							before={<Icon28UserAddBadgeOutline fill="#ffffff" />}
							style={{
								width: 50,
								height: 50,
								borderRadius: 12,
								marginLeft: 8,
								background: '#2688EB'
							}}
						/>
					</ButtonGroup>
				</div>
			</FixedLayout>
		)}
	</Panel>
);

};

export default QueueMenu;