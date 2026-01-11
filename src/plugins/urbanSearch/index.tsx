/*
 * Vencord, a Discord client mod
 * Copyright (c) 2022 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import { ApplicationCommandInputType } from "@api/Commands/types";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Forms } from "@webpack/common";

const urbandictionarylogo = "https://cdn.discordapp.com/emojis/1385084313590173799.png";

export default definePlugin({
    name: "UrbanDictionary",
    description: "Search for a word on Urban Dictionary via /urban command.",
    authors: [
        Devs.Kodarru
    ],
    dependencies: ["CommandsAPI"],

    settingsAboutComponent: () => <>
        <Forms.FormText className="vc-plugin-urbanSearch-notice">
            Enabling this plugin allows Urban-Dictionary to bypass Vencord's CSP Restrictions.
        </Forms.FormText>
    </>,

    commands: [
        {
            name: "urban",
            description: "Returns the definition of a word from Urban Dictionary",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.STRING,
                    name: "word",
                    description: "The word to search for on Urban Dictionary",
                    required: true
                }
            ],
            execute: async (args, ctx) => {
                try {
                    const query: string = encodeURIComponent(args[0].value);
                    const { list } = await fetch(`https://api.urbandictionary.com/v0/define?term=${query}`).then(response => response.json());

                    if (!list.length)
                        return void sendBotMessage(ctx.channel.id, { content: "No results found." });

                    const definition = list.reduce((prev, curr) => {
                        return prev.thumbs_up > curr.thumbs_up ? prev : curr;
                    });

                    const linkify = (text: string) => text
                        .replaceAll("\r\n", "\n")
                        .replace(/([*>_`~\\])/gsi, "\\$1")
                        .replace(/\[(.+?)\]/g, (_, word) => `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)} "Define '${word}' on Urban Dictionary")`)
                        .trim();

                    return void sendBotMessage(ctx.channel.id, {
                        embeds: [
                            {
                                type: "rich",
                                author: {
                                    name: `Uploaded by "${definition.author}"`,
                                    url: `https://www.urbandictionary.com/author.php?author=${encodeURIComponent(definition.author)}`,
                                },
                                title: definition.word,
                                url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(definition.word)}`,
                                description: linkify(definition.definition),
                                fields: [
                                    {
                                        name: "Example",
                                        value: linkify(definition.example),
                                    },
                                    {
                                        name: "Want more definitions?",
                                        value: `Check out [more definitions](https://www.urbandictionary.com/define.php?term=${query} "Define "${args[0].value}" on Urban Dictionary") on Urban Dictionary.`,
                                    },
                                ],
                                color: 0xFF9900,
                                footer: { text: `👍 ${definition.thumbs_up.toString()} | 👎 ${definition.thumbs_down.toString()}`, icon_url: urbandictionarylogo },
                                timestamp: new Date(definition.written_on).toISOString(),
                            },
                        ] as any,
                    });
                } catch (error) {
                    sendBotMessage(ctx.channel.id, {
                        content: `Something went wrong: \`${error}\``,
                    });
                }
            }
        }
    ]
});
