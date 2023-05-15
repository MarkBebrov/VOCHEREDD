import React, { useState, useEffect } from 'react';
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
} from '@vkontakte/vkui';
import { Icon24Add, Icon16GearOutline, Icon28ArrowLeftOutline } from '@vkontakte/icons'
	;

import '@vkontakte/vkui/dist/vkui.css';

function QueueMenu({ id, goBack, queue, isUserCreator }) {


	const queueTitle = queue.title;
	const queueDescription = queue.type === 'countdown' ? 'До начала' : 'Осталось времени';

	const [menuItems, setMenuItems] = useState([]);

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
					{menuItems.map((menuItem) => (
						<Cell key={menuItem.id} description={menuItem.description}>
							{menuItem.title}
						</Cell>
					))}
				</List>
			</Group>
		</Panel>
	);
};

export default QueueMenu;